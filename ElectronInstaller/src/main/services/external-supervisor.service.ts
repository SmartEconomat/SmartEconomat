import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";

import { app, type BrowserWindow } from "electron";

import type {
  DockerRuntimeStatus,
  HealthUpdateEvent,
  ServiceHealth,
  SupervisorCheck,
  SupervisorSnapshot,
  WatchdogStatus,
} from "@shared/contracts";
import { IPCChannels } from "@shared/ipc-channels";

import { resolveWindowsDockerCliPath } from "./docker-desktop-windows-resolve";
import { DockerOrchestratorService } from "./docker-orchestrator.service";
import { ProcessRunnerService } from "./process-runner.service";
import {
  mergeWindowsEssentialPathEntries,
  prependKnownDockerCliBinsOnPath,
  prependPathDirectory,
  tryResolveWindowsPowerShellExecutable,
} from "./windows-spawn-support";

interface ExternalSupervisorOptions {
  onLog: (message: string) => void;
  onTrayStateChange?: (state: "healthy" | "recovering" | "degraded") => void;
  intervalMs?: number;
}

const EXPECTED_SERVICES: ServiceHealth["service"][] = [
  "frontend",
  "backend",
  "db",
  "redis",
];
const AUTOMATIC_RECOVERY_COOLDOWN_MS = 60_000;
const ELEVATED_DOCKER_SERVICE_REPAIR_COOLDOWN_MS = 10 * 60_000;

export class ExternalSupervisorService {
  private readonly processRunner = new ProcessRunnerService();
  private readonly dockerOrchestrator = new DockerOrchestratorService();
  private readonly onLog: (message: string) => void;
  private readonly onTrayStateChange?: (
    state: "healthy" | "recovering" | "degraded",
  ) => void;
  private readonly intervalMs: number;
  private mainWindow: BrowserWindow | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private dockerCommand: string | null = null;
  private refreshing = false;
  private automaticRecoveryRunning = false;
  private lastAutomaticRecoveryAttemptMs = 0;
  private lastElevatedDockerServiceRepairAttemptMs = 0;
  private consecutiveAutomaticRecoveryFailures = 0;
  private lastHealth: ServiceHealth[] = [];
  private lastSnapshot: SupervisorSnapshot = {
    overallState: "degraded",
    checks: [],
    lastAutomaticActionAt: null,
    lastAutomaticAction: null,
    uptimeSeconds: 0,
    incidentsResolved: 0,
    incidentsOpen: 0,
    lastIncidentAt: null,
    latestIncident: null,
    recentIncidents: [],
  };

  constructor(options: ExternalSupervisorOptions) {
    this.onLog = options.onLog;
    this.onTrayStateChange = options.onTrayStateChange;
    this.intervalMs = options.intervalMs ?? 15_000;
  }

  setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  async bootstrap(): Promise<void> {
    try {
      await this.refreshSnapshot();
      this.pushHealthUpdate();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.onLog(`[SUPERVISOR] Error en bootstrap inicial: ${detail}`);
    }

    this.timer = setInterval(() => {
      void this.refreshAndPush().catch((error: unknown) => {
        const detail = error instanceof Error ? error.message : String(error);
        this.onLog(`[SUPERVISOR] Error asíncrono en refreshAndPush: ${detail}`);
      });
    }, this.intervalMs);
    this.onLog(
      "[SUPERVISOR] Cliente de supervisor externo activo (Windows Service).",
    );
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async onSystemResume(): Promise<void> {
    await this.refreshAndPush();
  }

  onSystemSuspend(): void {
    this.onLog("[SUPERVISOR] Sistema en suspensión.");
  }

  async restartDockerDesktopNow(): Promise<boolean> {
    const result = await this.runPowerShell(
      "Start-Service -Name com.docker.service -ErrorAction SilentlyContinue; exit 0",
    );
    await this.refreshAndPush();
    return result.ok;
  }

  async runRecoveryNow(): Promise<boolean> {
    return this.recoverStack(
      "manual",
      "Recuperación manual del stack Docker solicitada.",
    );
  }

  private async recoverStack(
    mode: "automatic" | "manual",
    actionLabel: string,
  ): Promise<boolean> {
    const startedAt = new Date().toISOString();
    this.lastSnapshot = {
      ...this.lastSnapshot,
      overallState: "recovering",
      lastAutomaticActionAt: startedAt,
      lastAutomaticAction: actionLabel,
    };
    this.onTrayStateChange?.("recovering");
    this.onLog(`[SUPERVISOR] ${actionLabel}`);
    this.pushHealthUpdate();

    const dockerServiceStarted = await this.ensureWindowsDockerServiceStarted(
      mode === "manual",
    );
    if (!dockerServiceStarted && process.platform === "win32") {
      this.onLog(
        "[SUPERVISOR] com.docker.service no pudo arrancar sin elevación; se intentará continuar con Docker y se notificará si el daemon no responde.",
      );
    }
    const runtimePath = await this.resolveRuntimePath();
    if (!runtimePath) {
      const message =
        "No se encontró runtime válido para restablecer el stack de SmartEconomat.";
      this.mergeLiveChecks([
        {
          id: "compose-stack",
          label: "Docker Compose stack",
          state: "error",
          detail: message,
          measuredAt: new Date().toISOString(),
        },
      ]);
      this.markRecoveryFailure(mode, message);
      this.pushHealthUpdate();
      return false;
    }

    const shouldRestart =
      this.lastHealth.length === 0 ||
      this.lastHealth.some((service) => service.status === "unhealthy");
    const recoveryResult = shouldRestart
      ? await this.dockerOrchestrator.restartStack(runtimePath)
      : await this.dockerOrchestrator.startStack(runtimePath, undefined, { forceClean: false });
    if (!recoveryResult.ok) {
      this.markRecoveryFailure(mode, recoveryResult.message);
      await this.refreshSnapshot();
      this.pushHealthUpdate();
      return false;
    }

    await this.refreshSnapshot();
    const recovered = this.lastSnapshot.overallState === "healthy";
    if (recovered) {
      this.consecutiveAutomaticRecoveryFailures = 0;
      this.lastSnapshot = {
        ...this.lastSnapshot,
        lastAutomaticActionAt: new Date().toISOString(),
        lastAutomaticAction:
          mode === "automatic"
            ? "Recuperación automática completada: stack operativo."
            : "Recuperación manual completada: stack operativo.",
      };
      this.onLog("[SUPERVISOR] Stack Docker operativo tras recuperación.");
    } else {
      this.markRecoveryFailure(
        mode,
        "El stack sigue degradado tras ejecutar la recuperación.",
      );
    }
    this.pushHealthUpdate();
    return recovered;
  }

  private async refreshAndPush(): Promise<void> {
    if (this.refreshing) {
      return;
    }

    this.refreshing = true;
    try {
      await this.refreshSnapshot();
      this.pushHealthUpdate();
      await this.maybeRunAutomaticRecovery();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.onLog(
        `[SUPERVISOR] Error no controlado en ciclo de refresco: ${detail}`,
      );
    } finally {
      this.refreshing = false;
    }
  }

  private async maybeRunAutomaticRecovery(): Promise<void> {
    if (
      this.lastSnapshot.overallState === "healthy" ||
      this.automaticRecoveryRunning
    ) {
      return;
    }

    const now = Date.now();
    if (
      now - this.lastAutomaticRecoveryAttemptMs <
      AUTOMATIC_RECOVERY_COOLDOWN_MS
    ) {
      return;
    }

    this.automaticRecoveryRunning = true;
    this.lastAutomaticRecoveryAttemptMs = now;
    try {
      await this.recoverStack(
        "automatic",
        "Recuperación automática: intentando restaurar WSL/Docker/contenedores.",
      );
    } finally {
      this.automaticRecoveryRunning = false;
    }
  }

  getSupervisorSnapshot(): SupervisorSnapshot {
    return this.lastSnapshot;
  }

  getStatus(): HealthUpdateEvent {
    return {
      health: this.lastHealth,
      watchdog: this.getWatchdogStatus(),
      supervisorSnapshot: this.lastSnapshot,
      timestamp: new Date().toISOString(),
    };
  }

  private getWatchdogStatus(): WatchdogStatus {
    const state =
      this.lastSnapshot.overallState === "healthy"
        ? "active"
        : this.lastSnapshot.overallState === "recovering"
          ? "recovering"
          : "backoff";
    const dockerStatus: DockerRuntimeStatus = {
      state:
        this.lastSnapshot.overallState === "healthy"
          ? "daemon-ready"
          : "daemon-error",
      detail:
        this.lastSnapshot.overallState === "healthy"
          ? "Supervisor reporta sistema saludable."
          : "Supervisor reporta degradación.",
      source: "runtime",
      retries: this.lastSnapshot.incidentsOpen,
      lastCheckedAt:
        this.lastSnapshot.lastIncidentAt ?? new Date().toISOString(),
    };

    return {
      state,
      consecutiveFailures: this.lastSnapshot.incidentsOpen,
      currentRecoveryLevel: 1,
      nextCheckInMs: this.intervalMs,
      lastCheck: this.lastSnapshot.lastIncidentAt,
      dockerStatus,
    };
  }

  private async refreshSnapshot(): Promise<void> {
    const statePath = path.join(
      "C:/ProgramData/SmartEconomat/state",
      "supervisor-state.json",
    );
    try {
      const currentActionAt = this.lastSnapshot.lastAutomaticActionAt;
      const currentAction = this.lastSnapshot.lastAutomaticAction;
      const raw = await fs.readFile(statePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<SupervisorSnapshot>;
      const parsedActionAt = parsed.lastAutomaticActionAt ?? null;
      const preferCurrentAction =
        currentActionAt !== null &&
        (parsedActionAt === null ||
          Date.parse(currentActionAt) >= Date.parse(parsedActionAt));
      this.lastSnapshot = {
        overallState: parsed.overallState ?? "degraded",
        checks: parsed.checks ?? [],
        lastAutomaticActionAt: preferCurrentAction
          ? currentActionAt
          : parsedActionAt,
        lastAutomaticAction: preferCurrentAction
          ? currentAction
          : (parsed.lastAutomaticAction ?? null),
        uptimeSeconds: parsed.uptimeSeconds ?? 0,
        incidentsResolved: parsed.incidentsResolved ?? 0,
        incidentsOpen: parsed.incidentsOpen ?? 0,
        lastIncidentAt: parsed.lastIncidentAt ?? null,
        latestIncident: parsed.latestIncident ?? null,
        recentIncidents: parsed.recentIncidents ?? [],
      };
    } catch {
      this.lastSnapshot = {
        ...this.lastSnapshot,
        overallState: "degraded",
      };
    }

    await this.refreshLiveDockerState();
    this.onTrayStateChange?.(this.lastSnapshot.overallState);
  }

  private async refreshLiveDockerState(): Promise<void> {
    const wslCheck = await this.getWindowsWslCheck();
    const serviceCheck = await this.getWindowsDockerServiceCheck();
    const result = await this.runDocker([
      "ps",
      "--filter",
      "label=com.docker.compose.project=smarteconomat-prod",
      "--format",
      "{{json .}}",
    ]);
    const measuredAt = new Date().toISOString();

    if (!result.ok) {
      this.lastHealth = EXPECTED_SERVICES.map((service) => ({
        service,
        status: "unknown",
        detail: `No se pudo consultar Docker en vivo: ${result.output}`,
      }));
      this.mergeLiveChecks([
        ...(wslCheck ? [wslCheck] : []),
        ...(serviceCheck ? [serviceCheck] : []),
        {
          id: "docker-engine",
          label: "Docker Engine",
          state: "error",
          detail: "Docker no responde a la consulta viva del sentinela.",
          measuredAt,
        },
        {
          id: "containers-running",
          label: "Contenedores Docker en vivo",
          state: "error",
          detail: "Docker no pudo devolver el inventario real de contenedores.",
          measuredAt,
        },
      ]);
      return;
    }

    const runningContainers = result.output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .flatMap((line) => {
        try {
          return [JSON.parse(line) as { Names?: string; Status?: string }];
        } catch {
          return [];
        }
      });

    const health = EXPECTED_SERVICES.map((service) => {
      const container = runningContainers.find((entry) =>
        (entry.Names ?? "").toLowerCase().includes(service),
      );
      if (!container) {
        return {
          service,
          status: "unknown",
          detail: `No se detectó contenedor activo para ${service}.`,
        } satisfies ServiceHealth;
      }

      const statusText = (container.Status ?? "").toLowerCase();
      const status: ServiceHealth["status"] = statusText.includes("unhealthy")
        ? "unhealthy"
        : statusText.includes("health: starting")
          ? "starting"
          : statusText.includes("healthy")
            ? "healthy"
            : statusText.includes("up")
              ? "running"
              : "unknown";

      return {
        service,
        status,
        detail: `Docker reporta ${container.Names}: ${container.Status ?? "sin estado"}.`,
      } satisfies ServiceHealth;
    });

    this.lastHealth = health;
    const missingServices = health.filter(
      (service) => service.status === "unknown",
    );
    const unhealthyServices = health.filter(
      (service) => service.status === "unhealthy",
    );
    const startingServices = health.filter(
      (service) => service.status === "starting",
    );
    const allHealthy = health.every(
      (service) => service.status === "healthy" || service.status === "running",
    );

    this.mergeLiveChecks([
      ...(wslCheck ? [wslCheck] : []),
      ...(serviceCheck ? [serviceCheck] : []),
      {
        id: "docker-engine",
        label: "Docker Engine",
        state: "ok",
        detail: "Docker responde y permite consultar contenedores en vivo.",
        measuredAt,
      },
      {
        id: "containers-running",
        label: "Contenedores Docker en vivo",
        state:
          missingServices.length > 0 || unhealthyServices.length > 0
            ? "error"
            : startingServices.length > 0
              ? "warn"
              : "ok",
        detail:
          missingServices.length > 0
            ? `Faltan contenedores activos: ${missingServices
                .map((service) => service.service)
                .join(", ")}.`
            : unhealthyServices.length > 0
              ? `Contenedores con incidencia: ${unhealthyServices
                  .map((service) => service.service)
                  .join(", ")}.`
              : startingServices.length > 0
                ? `Contenedores arrancando: ${startingServices
                    .map((service) => service.service)
                    .join(", ")}.`
                : "Frontend, backend, db y redis detectados en Docker.",
        measuredAt,
      },
      {
        id: "containers-health",
        label: "Healthchecks",
        state:
          missingServices.length > 0 || unhealthyServices.length > 0
            ? "error"
            : startingServices.length > 0
              ? "warn"
              : "ok",
        detail:
          missingServices.length > 0
            ? "No hay healthcheck fiable porque faltan contenedores obligatorios."
            : unhealthyServices.length > 0
              ? "Uno o más healthchecks de Docker están fallando."
              : startingServices.length > 0
                ? "Healthchecks todavía arrancando."
                : "Healthchecks de Docker en estado correcto.",
        measuredAt,
      },
      {
        id: "compose-stack",
        label: "Docker Compose stack",
        state: allHealthy
          ? "ok"
          : startingServices.length > 0
            ? "warn"
            : "error",
        detail: allHealthy
          ? "El stack smarteconomat-prod está operativo."
          : "El stack smarteconomat-prod no está completamente operativo.",
        measuredAt,
      },
    ]);

    if (
      missingServices.length === 0 &&
      unhealthyServices.length === 0 &&
      !allHealthy &&
      startingServices.length > 0
    ) {
      this.lastSnapshot = {
        ...this.lastSnapshot,
        overallState: "recovering",
      };
    }
  }

  private mergeLiveChecks(liveChecks: SupervisorCheck[]): void {
    const hasErrors = liveChecks.some((check) => check.state === "error");
    const hasWarnings = liveChecks.some((check) => check.state === "warn");
    const overallState = hasErrors
      ? "degraded"
      : hasWarnings
        ? "recovering"
        : "healthy";
    const incident =
      overallState === "degraded"
        ? {
            id: "live-docker-state",
            service: "docker",
            title: "Estado real Docker degradado",
            detail:
              liveChecks.find((check) => check.state === "error")?.detail ??
              "El sentinela detectó un problema en Docker.",
            severity: "critical" as const,
            state: "open" as const,
            detectedAt: new Date().toISOString(),
            occurrences: 1,
          }
        : null;

    this.lastSnapshot = {
      ...this.lastSnapshot,
      checks: liveChecks,
      overallState,
      incidentsOpen: incident ? 1 : 0,
      lastIncidentAt: incident?.detectedAt ?? this.lastSnapshot.lastIncidentAt,
      latestIncident: incident,
      recentIncidents: incident ? [incident] : [],
    };
  }

  private markRecoveryFailure(
    mode: "automatic" | "manual",
    reason: string,
  ): void {
    if (mode === "automatic") {
      this.consecutiveAutomaticRecoveryFailures += 1;
    }

    const action =
      mode === "automatic"
        ? `Recuperación automática fallida (${this.consecutiveAutomaticRecoveryFailures}): ${reason}`
        : `Recuperación manual fallida: ${reason}`;
    this.lastSnapshot = {
      ...this.lastSnapshot,
      overallState: "degraded",
      lastAutomaticActionAt: new Date().toISOString(),
      lastAutomaticAction: action,
    };
    this.onLog(`[SUPERVISOR] ${action}`);
  }

  private async resolveRuntimePath(): Promise<string | null> {
    const markerPath = path.join(
      app.getPath("appData"),
      "SmartEconomatInstaller",
      "runtime-path.txt",
    );
    const candidates = [
      await this.readRuntimeMarker(markerPath),
      "C:/SmartEconomatRuntime",
    ]
      .filter((value): value is string => value.length > 0)
      .filter((value, index, all) => all.indexOf(value) === index);

    for (const candidate of candidates) {
      try {
        await Promise.all([
          fs.access(path.join(candidate, ".env.prod")),
          fs.access(path.join(candidate, "project", "docker-compose.prod.yml")),
        ]);
        return candidate;
      } catch {
        // Sigue probando rutas conocidas.
      }
    }

    return null;
  }

  private async readRuntimeMarker(markerPath: string): Promise<string> {
    try {
      return (await fs.readFile(markerPath, "utf8")).trim();
    } catch {
      return "";
    }
  }

  private async ensureWindowsDockerServiceStarted(
    allowElevation: boolean,
  ): Promise<boolean> {
    if (process.platform !== "win32") {
      return true;
    }

    await this.runPowerShell(
      [
        "$service = Get-Service -Name 'com.docker.service' -ErrorAction SilentlyContinue",
        "if ($null -ne $service) {",
        "  sc.exe config com.docker.service start= auto | Out-Null",
        "  sc.exe failure com.docker.service reset= 86400 actions= restart/5000/restart/15000/restart/30000 | Out-Null",
        "  Start-Service -Name com.docker.service -ErrorAction SilentlyContinue",
        "}",
        "exit 0",
      ].join("; "),
    );

    if (await this.isWindowsDockerServiceRunning()) {
      return true;
    }

    const now = Date.now();
    if (
      now - this.lastElevatedDockerServiceRepairAttemptMs <
      ELEVATED_DOCKER_SERVICE_REPAIR_COOLDOWN_MS
    ) {
      return false;
    }

    if (!allowElevation) {
      this.onLog(
        "[SUPERVISOR] Requiere elevacion para reparar com.docker.service, pero se omite en recuperacion automatica para evitar prompts UAC repetitivos.",
      );
      return false;
    }

    this.lastElevatedDockerServiceRepairAttemptMs = now;
    this.onLog(
      "[SUPERVISOR] Docker Desktop Service requiere elevación. Solicitando UAC para reparación controlada.",
    );
    await this.runPowerShell(
      [
        '$script = "',
        "$ErrorActionPreference = 'SilentlyContinue';",
        "sc.exe config com.docker.service start= auto | Out-Null;",
        "sc.exe failure com.docker.service reset= 86400 actions= restart/5000/restart/15000/restart/30000 | Out-Null;",
        "Set-Service -Name com.docker.service -StartupType Automatic;",
        "Start-Service -Name com.docker.service;",
        "Start-Sleep -Seconds 3;",
        "exit 0",
        '"',
        ";",
        "Start-Process -FilePath powershell.exe -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-Command',$script) -Verb RunAs -Wait",
      ].join(" "),
    );

    return this.isWindowsDockerServiceRunning();
  }

  private async isWindowsDockerServiceRunning(): Promise<boolean> {
    const statusResult = await this.runPowerShell(
      "$service = Get-Service -Name 'com.docker.service' -ErrorAction SilentlyContinue; if ($null -eq $service) { Write-Output 'missing'; exit 0 }; Write-Output $service.Status",
    );
    return statusResult.output.trim().toLowerCase() === "running";
  }

  private async getWindowsWslCheck(): Promise<SupervisorCheck | null> {
    if (process.platform !== "win32") {
      return null;
    }

    const measuredAt = new Date().toISOString();
    const result = await this.runPowerShell(
      "wsl --status 2>$null | Out-String",
    );
    const output = result.output.trim();

    return {
      id: "wsl2",
      label: "WSL2",
      state: result.ok && output.length > 0 ? "ok" : "error",
      detail:
        result.ok && output.length > 0
          ? "WSL responde correctamente para el backend Docker."
          : "WSL no responde o no está disponible; Docker Desktop no puede estabilizar el engine Linux.",
      measuredAt,
    };
  }

  private async getWindowsDockerServiceCheck(): Promise<SupervisorCheck | null> {
    if (process.platform !== "win32") {
      return null;
    }

    const measuredAt = new Date().toISOString();
    const result = await this.runPowerShell(
      "$service = Get-Service -Name 'com.docker.service' -ErrorAction SilentlyContinue; if ($null -eq $service) { Write-Output 'missing'; exit 0 }; Write-Output $service.Status",
    );
    const status = result.output.trim().toLowerCase();

    return {
      id: "docker-desktop",
      label: "Docker Desktop Service",
      state: result.ok && status === "running" ? "ok" : "error",
      detail:
        result.ok && status === "running"
          ? "com.docker.service está en ejecución."
          : status === "missing"
            ? "No se detectó el servicio Windows com.docker.service."
            : `com.docker.service no está en ejecución. Estado real: ${status || "desconocido"}.`,
      measuredAt,
    };
  }

  private pushHealthUpdate(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }
    this.mainWindow.webContents.send(
      IPCChannels.runtime.healthUpdate,
      this.getStatus(),
    );
  }

  private getChildProcessEnvForExecFile(): NodeJS.ProcessEnv {
    if (process.platform !== "win32") {
      return { ...process.env };
    }

    const dockerCli = this.dockerCommand;
    let next = mergeWindowsEssentialPathEntries({ ...process.env });
    if (
      dockerCli &&
      path.isAbsolute(dockerCli) &&
      dockerCli.toLowerCase().endsWith(".exe")
    ) {
      next = prependPathDirectory(next, path.dirname(dockerCli));
    } else {
      next = prependKnownDockerCliBinsOnPath(next);
    }
    return next;
  }

  private resolvePowerShellExecutableForExecFile(): string {
    if (process.platform !== "win32") {
      return "powershell";
    }
    return tryResolveWindowsPowerShellExecutable() ?? "powershell.exe";
  }

  private async runPowerShell(
    script: string,
  ): Promise<{ ok: boolean; output: string }> {
    return new Promise((resolve) => {
      execFile(
        this.resolvePowerShellExecutableForExecFile(),
        ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
        {
          windowsHide: true,
          env: this.getChildProcessEnvForExecFile(),
        },
        (error, stdout, stderr) => {
          if (error) {
            resolve({ ok: false, output: stderr || error.message });
            return;
          }
          resolve({ ok: true, output: stdout });
        },
      );
    });
  }

  private async runDocker(
    args: string[],
  ): Promise<{ ok: boolean; output: string }> {
    const command = await this.getDockerCommand();
    const attempts =
      process.platform === "win32"
        ? [
            ["--context", "desktop-linux", ...args],
            ["--context", "default", ...args],
            args,
          ]
        : [args];
    let lastOutput = "";

    for (const attemptArgs of attempts) {
      const result = await new Promise<{ ok: boolean; output: string }>(
        (resolve) => {
          execFile(
            command,
            attemptArgs,
            {
              windowsHide: true,
              env: this.getChildProcessEnvForExecFile(),
            },
            (error, stdout, stderr) => {
              if (error) {
                resolve({ ok: false, output: stderr || error.message });
                return;
              }
              resolve({ ok: true, output: stdout });
            },
          );
        },
      );
      if (result.ok) {
        return result;
      }
      lastOutput = result.output;
    }

    return { ok: false, output: lastOutput };
  }

  private async getDockerCommand(): Promise<string> {
    if (this.dockerCommand) {
      return this.dockerCommand;
    }

    const resolved = await resolveWindowsDockerCliPath(
      this.processRunner,
      8_000,
    );
    this.dockerCommand = resolved ?? "docker";
    return this.dockerCommand;
  }
}
