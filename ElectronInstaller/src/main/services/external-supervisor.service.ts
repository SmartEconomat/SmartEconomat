import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";

import type { BrowserWindow } from "electron";

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
import { ProcessRunnerService } from "./process-runner.service";

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

export class ExternalSupervisorService {
  private readonly processRunner = new ProcessRunnerService();
  private readonly onLog: (message: string) => void;
  private readonly onTrayStateChange?: (
    state: "healthy" | "recovering" | "degraded",
  ) => void;
  private readonly intervalMs: number;
  private mainWindow: BrowserWindow | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private dockerCommand: string | null = null;
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
    await this.refreshSnapshot();
    this.pushHealthUpdate();
    this.timer = setInterval(() => {
      void this.refreshSnapshot().then(() => {
        this.pushHealthUpdate();
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
    await this.refreshSnapshot();
    this.pushHealthUpdate();
  }

  onSystemSuspend(): void {
    this.onLog("[SUPERVISOR] Sistema en suspensión.");
  }

  async restartDockerDesktopNow(): Promise<boolean> {
    const result = await this.runPowerShell(
      "Start-Service -Name com.docker.service -ErrorAction SilentlyContinue; exit 0",
    );
    await this.refreshSnapshot();
    this.pushHealthUpdate();
    return result.ok;
  }

  async runRecoveryNow(): Promise<void> {
    await this.runPowerShell(
      "Restart-Service -Name SmartEconomatSupervisor -ErrorAction SilentlyContinue; exit 0",
    );
    await this.refreshSnapshot();
    this.pushHealthUpdate();
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
      state:
        this.lastSnapshot.overallState === "healthy" ? "active" : "recovering",
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
      const raw = await fs.readFile(statePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<SupervisorSnapshot>;
      this.lastSnapshot = {
        overallState: parsed.overallState ?? "degraded",
        checks: parsed.checks ?? [],
        lastAutomaticActionAt: parsed.lastAutomaticActionAt ?? null,
        lastAutomaticAction: parsed.lastAutomaticAction ?? null,
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
        ...(serviceCheck ? [serviceCheck] : []),
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
      ...(serviceCheck ? [serviceCheck] : []),
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
    const liveIds = new Set(liveChecks.map((check) => check.id));
    const preservedChecks = this.lastSnapshot.checks.filter(
      (check) => !liveIds.has(check.id),
    );
    const mergedChecks = [...preservedChecks, ...liveChecks];
    const hasErrors = mergedChecks.some((check) => check.state === "error");
    const hasWarnings = mergedChecks.some((check) => check.state === "warn");
    this.lastSnapshot = {
      ...this.lastSnapshot,
      checks: mergedChecks,
      overallState: hasErrors
        ? "degraded"
        : hasWarnings
          ? "recovering"
          : "healthy",
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

  private async runPowerShell(
    script: string,
  ): Promise<{ ok: boolean; output: string }> {
    return new Promise((resolve) => {
      execFile(
        "powershell.exe",
        ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
        { windowsHide: true },
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
            { windowsHide: true },
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
