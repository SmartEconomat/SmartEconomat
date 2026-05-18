import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";

import { Notification, app, type BrowserWindow } from "electron";

import type {
  DockerRuntimeStatus,
  HealthUpdateEvent,
  ServiceHealth,
  SupervisorCheck,
  SupervisorSnapshot,
  TraySupervisorState,
  WatchdogStatus,
} from "@shared/contracts";
import { IPCChannels } from "@shared/ipc-channels";

import { PathResolverService } from "./path-resolver.service";
import { resolveWindowsDockerCliPath } from "./docker-desktop-windows-resolve";
import { DockerOrchestratorService } from "./docker-orchestrator.service";
import { DockerReadinessService } from "./docker-readiness.service";
import { recordObservation } from "./incident-policy";
import {
  mapDockerRuntimeToPlatform,
  mapHealthToStack,
} from "./platform-state.service";
import { ProcessRunnerService } from "./process-runner.service";
import { getSessionStartupGuard } from "./session-startup-guard";
import { evaluateSupervisorChecks } from "./supervisor-health-model";
import type { SupervisorLifecycleController } from "./supervisor-lifecycle.controller";
import {
  DOCKER_SERVICE_STARTMODE_MANUAL,
  WindowsDockerServiceConfigService,
} from "./windows-docker-service-config.service";
import {
  allowsAutomaticRecovery,
  computeObserveIntervalMs,
  LIGHT_RECOVERY_COOLDOWN_MS,
  MAX_LIGHT_REPAIRS_PER_SESSION,
  shouldRunRecovery,
} from "./supervisor-policy";
import {
  mergeWindowsEssentialPathEntries,
  prependKnownDockerCliBinsOnPath,
  prependPathDirectory,
  tryResolveWindowsPowerShellExecutable,
} from "./windows-spawn-support";

interface ExternalSupervisorOptions {
  onLog: (message: string) => void;
  onTrayStateChange?: (state: TraySupervisorState) => void;
  lifecycle: SupervisorLifecycleController;
}

const EXPECTED_SERVICES: ServiceHealth["service"][] = [
  "frontend",
  "backend",
  "db",
  "redis",
];
const ELEVATED_DOCKER_SERVICE_REPAIR_COOLDOWN_MS = 10 * 60_000;

export class ExternalSupervisorService {
  private readonly processRunner = new ProcessRunnerService();
  private readonly dockerServiceConfig: WindowsDockerServiceConfigService;
  private readonly dockerOrchestrator: DockerOrchestratorService;
  private readonly dockerReadiness = new DockerReadinessService();
  private readonly lifecycle: SupervisorLifecycleController;
  private readonly onLog: (message: string) => void;
  private readonly onTrayStateChange?: (state: TraySupervisorState) => void;
  private mainWindow: BrowserWindow | null = null;
  private observeTimer: ReturnType<typeof setTimeout> | null = null;
  private observeFailureCount = 0;
  private lightRepairsThisSession = 0;
  private lastDockerRuntimeStatus: DockerRuntimeStatus = {
    state: "daemon-starting",
    detail: "Aún no verificado.",
    source: "runtime",
    retries: 0,
    lastCheckedAt: new Date().toISOString(),
  };
  private dockerCommand: string | null = null;
  private refreshing = false;
  private automaticRecoveryRunning = false;
  private lastAutomaticRecoveryAttemptMs = 0;
  private lastElevatedDockerServiceRepairAttemptMs = 0;
  private consecutiveAutomaticRecoveryFailures = 0;
  private lastUserNotificationKey: string | null = null;
  private lastHealth: ServiceHealth[] = [];
  private lastSnapshot: SupervisorSnapshot = {
    overallState: "stabilizing",
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
    this.lifecycle = options.lifecycle;
    const pathResolver = new PathResolverService();
    this.dockerServiceConfig = new WindowsDockerServiceConfigService(
      this.processRunner,
      pathResolver,
    );
    this.dockerOrchestrator = new DockerOrchestratorService(
      pathResolver,
      this.processRunner,
    );
    this.dockerOrchestrator.setExecutionContext("runtime-auto-light");
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

    this.scheduleObserveCycle();
    this.onLog(
      "[SUPERVISOR] Cliente de supervisor en modo OBSERVE_ONLY (sin reparación en arranque).",
    );
  }

  stop(): void {
    if (this.observeTimer) {
      clearTimeout(this.observeTimer);
      this.observeTimer = null;
    }
  }

  private scheduleObserveCycle(): void {
    if (this.observeTimer) {
      clearTimeout(this.observeTimer);
    }
    const intervalMs = computeObserveIntervalMs(
      this.lifecycle.getPhase(),
      this.observeFailureCount,
    );
    this.observeTimer = setTimeout(() => {
      void this.refreshAndPush()
        .catch((error: unknown) => {
          const detail = error instanceof Error ? error.message : String(error);
          this.onLog(`[SUPERVISOR] Error asíncrono en refreshAndPush: ${detail}`);
        })
        .finally(() => {
          this.scheduleObserveCycle();
        });
    }, intervalMs);
  }

  async onSystemResume(): Promise<void> {
    await this.refreshAndPush();
  }

  onSystemSuspend(): void {
    this.onLog("[SUPERVISOR] Sistema en suspensión.");
  }

  async restartDockerDesktopNow(): Promise<boolean> {
    if (this.shouldDeferElectronScripts()) {
      this.onLog(
        "[SUPERVISOR] Reinicio de Docker Desktop diferido durante gracia de arranque de Windows.",
      );
      return false;
    }
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
    if (mode === "automatic") {
      this.maybeNotifyUser();
    }
    this.pushHealthUpdate();

    if (mode === "manual") {
      this.dockerOrchestrator.setExecutionContext("user-repair");
    } else {
      this.dockerOrchestrator.setExecutionContext("runtime-auto-light");
    }

    if (mode === "manual") {
      const dockerServiceStarted = await this.ensureWindowsDockerServiceStarted(
        true,
      );
      if (!dockerServiceStarted && process.platform === "win32") {
        this.onLog(
          "[SUPERVISOR] com.docker.service no pudo arrancar; se intentará continuar con operaciones Docker.",
        );
      }
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

    const affectedServices = this.lastHealth.filter(
      (service) =>
        service.status === "unhealthy" || service.status === "unknown",
    );

    if (mode === "automatic" && affectedServices.length === 0) {
      this.onLog(
        "[SUPERVISOR] Recuperación automática omitida: no hay contenedores con fallo confirmado.",
      );
      this.pushHealthUpdate();
      return false;
    }

    const recoveryResult =
      mode === "manual" && affectedServices.length === 0
        ? await this.dockerOrchestrator.startStack(runtimePath, undefined, {
            forceClean: false,
          })
        : await this.dockerOrchestrator.restartStack(runtimePath);

    if (mode !== "manual") {
      this.dockerOrchestrator.setExecutionContext("runtime-auto-light");
    }

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
      this.lastUserNotificationKey = null;
      this.lastSnapshot = {
        ...this.lastSnapshot,
        lastAutomaticActionAt: new Date().toISOString(),
        lastAutomaticAction:
          mode === "automatic"
            ? "Recuperación automática completada: stack operativo."
            : "Recuperación manual completada: stack operativo.",
      };
      this.onLog("[SUPERVISOR] Stack Docker operativo tras recuperación.");
      if (mode === "automatic") {
        this.notifyUserOnce(
          "recovered-auto",
          "SmartEconomat — stack recuperado",
          "El sentinela restauró el stack Docker automáticamente.",
        );
      }
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
    const phase = this.lifecycle.getPhase();
    if (
      !allowsAutomaticRecovery(phase) ||
      this.lastSnapshot.overallState === "healthy" ||
      this.lastSnapshot.overallState === "stabilizing" ||
      this.automaticRecoveryRunning
    ) {
      return;
    }

    if (this.lightRepairsThisSession >= MAX_LIGHT_REPAIRS_PER_SESSION) {
      return;
    }

    const now = Date.now();
    if (
      !shouldRunRecovery(
        now,
        this.lastAutomaticRecoveryAttemptMs,
        LIGHT_RECOVERY_COOLDOWN_MS,
      )
    ) {
      return;
    }

    const hasStackFailure = this.lastHealth.some(
      (service) =>
        service.status === "unhealthy" || service.status === "unknown",
    );
    if (!hasStackFailure) {
      return;
    }

    const decision = recordObservation(
      "stack-degraded",
      true,
      now,
      phase,
    );
    if (decision !== "eligible-for-light-repair") {
      return;
    }

    this.automaticRecoveryRunning = true;
    this.lastAutomaticRecoveryAttemptMs = now;
    try {
      const recovered = await this.recoverStack(
        "automatic",
        "Recuperación automática ligera: compose restart.",
      );
      if (recovered) {
        this.lightRepairsThisSession += 1;
      }
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
    const overall = this.lastSnapshot.overallState;
    const state =
      overall === "healthy"
        ? "active"
        : overall === "stabilizing"
          ? "idle"
          : overall === "recovering"
            ? "recovering"
            : "backoff";

    return {
      state,
      consecutiveFailures: this.lastSnapshot.incidentsOpen,
      currentRecoveryLevel: 1,
      nextCheckInMs: computeObserveIntervalMs(
        this.lifecycle.getPhase(),
        this.observeFailureCount,
      ),
      lastCheck: this.lastSnapshot.lastIncidentAt ?? new Date().toISOString(),
      dockerStatus: this.lastDockerRuntimeStatus,
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
      const parsed = JSON.parse(raw) as Partial<SupervisorSnapshot> & {
        Overall?: string;
      };
      const parsedActionAt = parsed.lastAutomaticActionAt ?? null;
      const fileOverall =
        parsed.overallState ??
        (parsed.Overall === "stabilizing"
          ? "stabilizing"
          : parsed.Overall === "healthy"
            ? "healthy"
            : parsed.Overall === "degraded"
              ? "degraded"
              : undefined);
      const preferCurrentAction =
        currentActionAt !== null &&
        (parsedActionAt === null ||
          Date.parse(currentActionAt) >= Date.parse(parsedActionAt));
      this.lastSnapshot = {
        overallState:
          fileOverall ??
          (this.lifecycle.isInBootGrace() ? "stabilizing" : "degraded"),
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
        healthModel: parsed.healthModel,
      };
    } catch {
      this.lastSnapshot = {
        ...this.lastSnapshot,
        overallState: this.lifecycle.isInBootGrace()
          ? "stabilizing"
          : "degraded",
      };
    }

    if (this.shouldDeferElectronScripts()) {
      this.applyDeferredStartupObservation();
    } else {
      await this.refreshLiveDockerState();
    }
    this.emitTrayState();
    this.maybeNotifyUser();
  }

  private shouldDeferElectronScripts(): boolean {
    return getSessionStartupGuard()?.shouldDeferElectronScripts() ?? false;
  }

  private applyDeferredStartupObservation(): void {
    const remainingMs = this.lifecycle.getBootGraceRemainingMs();
    const minutes = Math.max(1, Math.ceil(remainingMs / 60_000));
    const measuredAt = new Date().toISOString();
    this.lastDockerRuntimeStatus = {
      state: "daemon-starting",
      detail: `Observación en vivo diferida durante arranque de Windows (~${minutes} min). El servicio Windows SmartEconomatSupervisor sigue monitorizando.`,
      source: "runtime",
      retries: 0,
      lastCheckedAt: measuredAt,
    };
    this.lastHealth = EXPECTED_SERVICES.map((service) => ({
      service,
      status: "unknown",
      detail:
        "Inventario de contenedores pendiente: sin scripts desde Electron hasta finalizar la gracia de boot.",
    }));
    this.mergeLiveChecks([
      {
        id: "startup-deferral",
        label: "Arranque de Windows",
        state: "warn",
        detail: `Sin ejecución de scripts desde Electron (~${minutes} min restantes). Estado leído del supervisor Windows.`,
        measuredAt,
        authority: "primary",
        affectsOverall: true,
      },
    ]);
    this.lifecycle.updateFromPlatformStack("STABILIZING", "STACK_UNKNOWN");
    this.lastSnapshot = {
      ...this.lastSnapshot,
      overallState: "stabilizing",
      platform: {
        platform: "STABILIZING",
        stack: "STACK_UNKNOWN",
        lifecyclePhase: this.lifecycle.getPhase(),
        bootGraceRemainingMs: remainingMs,
      },
    };
  }

  private emitTrayState(): void {
    const trayState = this.mapSnapshotToTrayState(this.lastSnapshot.overallState);
    this.onTrayStateChange?.(trayState);
  }

  private mapSnapshotToTrayState(
    overall: SupervisorSnapshot["overallState"],
  ): TraySupervisorState {
    if (overall === "stabilizing") {
      return "stabilizing";
    }
    if (overall === "healthy") {
      return "healthy";
    }
    if (overall === "recovering") {
      return "recovering";
    }
    return "degraded";
  }

  private async refreshLiveDockerState(): Promise<void> {
    if (this.shouldDeferElectronScripts()) {
      this.applyDeferredStartupObservation();
      return;
    }

    const inBootGrace = this.lifecycle.isInBootGrace();
    const probeTimeoutMs = inBootGrace ? 25_000 : 12_000;
    this.lastDockerRuntimeStatus = await this.dockerReadiness.probe({
      source: "runtime",
      timeoutMs: probeTimeoutMs,
    });

    const platform = mapDockerRuntimeToPlatform(
      this.lastDockerRuntimeStatus,
      inBootGrace,
    );
    if (platform === "DAEMON_READY") {
      this.lifecycle.recordProbeSuccess();
    } else if (platform !== "STABILIZING" && platform !== "DAEMON_STARTING") {
      this.lifecycle.recordProbeFailure();
    }

    const wslCheck = await this.getWindowsWslCheck(inBootGrace);
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
      this.observeFailureCount += 1;
      this.lastHealth = EXPECTED_SERVICES.map((service) => ({
        service,
        status: "unknown",
        detail: `No se pudo consultar Docker en vivo: ${result.output}`,
      }));
      const transientState = inBootGrace ? ("warn" as const) : ("error" as const);
      this.mergeLiveChecks([
        ...(wslCheck ? [wslCheck] : []),
        ...(serviceCheck ? [serviceCheck] : []),
        {
          id: "docker-engine",
          label: "Docker Engine",
          state: transientState,
          detail: inBootGrace
            ? "Esperando disponibilidad del daemon Docker (arranque en curso)."
            : "Docker no responde a la consulta viva del sentinela.",
          measuredAt,
          authority: "primary",
          affectsOverall: true,
        },
        {
          id: "containers-running",
          label: "Contenedores Docker en vivo",
          state: transientState,
          detail: inBootGrace
            ? "Inventario de contenedores pendiente mientras Docker arranca."
            : "Docker no pudo devolver el inventario real de contenedores.",
          measuredAt,
          authority: "primary",
          affectsOverall: true,
        },
      ]);
      return;
    }

    this.observeFailureCount = Math.max(0, this.observeFailureCount - 1);

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
        authority: "primary",
        affectsOverall: true,
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
              authority: "primary",
              affectsOverall: true,
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
              authority: "primary",
              affectsOverall: true,
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
        authority: "primary",
        affectsOverall: true,
      },
    ]);

    const stack = mapHealthToStack(
      health,
      this.lastDockerRuntimeStatus.state === "daemon-ready",
      inBootGrace,
    );
    this.lifecycle.updateFromPlatformStack(platform, stack);

    this.lastSnapshot = {
      ...this.lastSnapshot,
      platform: {
        platform,
        stack,
        lifecyclePhase: this.lifecycle.getPhase(),
        bootGraceRemainingMs: this.lifecycle.getBootGraceRemainingMs(),
      },
    };

    if (
      missingServices.length === 0 &&
      unhealthyServices.length === 0 &&
      !allHealthy &&
      startingServices.length > 0
    ) {
      this.lastSnapshot = {
        ...this.lastSnapshot,
        overallState: inBootGrace ? "stabilizing" : "recovering",
      };
    }
  }

  private mergeLiveChecks(liveChecks: SupervisorCheck[]): void {
    const inBootGrace = this.lifecycle.isInBootGrace();
    const evaluation = evaluateSupervisorChecks(liveChecks, inBootGrace);
    const incident = evaluation.incident;

    this.lastSnapshot = {
      ...this.lastSnapshot,
      checks: evaluation.checks,
      overallState: evaluation.overallState,
      incidentsOpen: incident ? 1 : 0,
      lastIncidentAt: incident?.detectedAt ?? this.lastSnapshot.lastIncidentAt,
      latestIncident: incident,
      recentIncidents: incident ? [incident] : [],
      healthModel: evaluation.healthModel,
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

    if (mode === "automatic") {
      this.maybeNotifyUser();
    }
  }

  private notifyUserOnce(key: string, title: string, body: string): void {
    if (this.lastUserNotificationKey === key) {
      return;
    }
    this.lastUserNotificationKey = key;
    this.sendNotification(title, body);
  }

  private sendNotification(title: string, body: string): void {
    if (!Notification.isSupported()) {
      return;
    }
    try {
      const notification = new Notification({ title, body, silent: false });
      notification.show();
    } catch {
      // Ignorar fallos de notificación del SO.
    }
  }

  private maybeNotifyUser(): void {
    const state = this.lastSnapshot.overallState;

    if (state === "healthy") {
      this.lastUserNotificationKey = null;
      return;
    }

    if (state === "stabilizing") {
      return;
    }

    if (state === "recovering") {
      this.notifyUserOnce(
        "recovering",
        "SmartEconomat — reparación en curso",
        "El sentinela está intentando recuperar el stack Docker automáticamente.",
      );
      return;
    }

    if (state !== "degraded") {
      return;
    }

    const needsIntervention =
      this.lightRepairsThisSession >= MAX_LIGHT_REPAIRS_PER_SESSION ||
      this.consecutiveAutomaticRecoveryFailures >= 2;

    if (needsIntervention) {
      this.notifyUserOnce(
        "intervention-required",
        "SmartEconomat requiere intervención",
        "No se pudo reparar automáticamente el stack Docker. Abre el panel de control para revisar el estado o pulsa «Reparar ahora».",
      );
      return;
    }

    const incident = this.lastSnapshot.latestIncident;
    if (incident) {
      this.notifyUserOnce(
        `degraded-${incident.id}`,
        "SmartEconomat — incidencia detectada",
        incident.detail,
      );
      return;
    }

    this.notifyUserOnce(
      "degraded-generic",
      "SmartEconomat — problema en Docker",
      "El sentinela detectó un problema en los contenedores y seguirá intentando repararlo.",
    );
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

    const configured = await this.dockerServiceConfig.ensureAutomatic({
      startIfStopped: true,
    });

    if (!configured.ok) {
      if (configured.errorCode === DOCKER_SERVICE_STARTMODE_MANUAL) {
        this.onLog(
          `[SUPERVISOR] ${DOCKER_SERVICE_STARTMODE_MANUAL}: com.docker.service sigue en ${configured.startMode}. ${configured.detail}`,
        );
      } else if (configured.errorCode) {
        this.onLog(
          `[SUPERVISOR] No se pudo configurar com.docker.service (${configured.errorCode}): ${configured.detail}`,
        );
      }
    }

    if (configured.ok && (await this.isWindowsDockerServiceRunning())) {
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

    const guard = getSessionStartupGuard();
    if (guard && !guard.allowsElevation("user-repair")) {
      this.onLog(
        "[SUPERVISOR] Elevación diferida durante gracia de arranque de Windows; se omite UAC.",
      );
      return false;
    }

    this.lastElevatedDockerServiceRepairAttemptMs = now;
    this.onLog(
      "[SUPERVISOR] Docker Desktop Service requiere elevación. Solicitando UAC para reparación controlada.",
    );

    const elevated = await this.runElevatedDockerServiceConfigScript();
    if (!elevated.ok && elevated.errorCode === DOCKER_SERVICE_STARTMODE_MANUAL) {
      this.onLog(
        `[SUPERVISOR] ${DOCKER_SERVICE_STARTMODE_MANUAL} tras UAC: ${elevated.detail}`,
      );
    }

    return (
      elevated.ok && (await this.isWindowsDockerServiceRunning())
    );
  }

  private async runElevatedDockerServiceConfigScript(): Promise<
    import("./windows-docker-service-config.service").ComDockerServiceConfigResult
  > {
    const resolver = new PathResolverService();
    const resolvedScript = path.join(
      resolver.getInstallerScriptsRoot(),
      "ops",
      "ensure-com-docker-service-automatic.ps1",
    );
    const safePath = resolvedScript.replace(/'/g, "''");
    await this.runPowerShell(
      [
        `$argumentList = @('-NoProfile','-ExecutionPolicy','Bypass','-File','${safePath}','-StartIfStopped')`,
        "$process = Start-Process -FilePath powershell.exe -Verb RunAs -Wait -PassThru -ArgumentList $argumentList",
        "if ($null -eq $process) { exit 1 }",
        "exit $process.ExitCode",
      ].join("; "),
    );

    return this.dockerServiceConfig.ensureAutomatic({ startIfStopped: false });
  }

  private async isWindowsDockerServiceRunning(): Promise<boolean> {
    const statusResult = await this.runPowerShell(
      "$service = Get-Service -Name 'com.docker.service' -ErrorAction SilentlyContinue; if ($null -eq $service) { Write-Output 'missing'; exit 0 }; Write-Output $service.Status",
    );
    return statusResult.output.trim().toLowerCase() === "running";
  }

  private async getWindowsWslCheck(
    inBootGrace: boolean,
  ): Promise<SupervisorCheck | null> {
    if (process.platform !== "win32") {
      return null;
    }

    const measuredAt = new Date().toISOString();
    const result = await this.runPowerShell(
      "wsl --status 2>$null | Out-String",
    );
    const output = result.output.trim();
    const wslOk = result.ok && output.length > 0;

    return {
      id: "wsl2",
      label: "WSL2",
      state: wslOk ? "ok" : "warn",
      detail:
        wslOk
          ? "WSL responde correctamente para el backend Docker."
          : inBootGrace
            ? "WSL aún no responde; puede ser normal durante el arranque del sistema."
            : "WSL no responde o no está disponible; se registra como telemetría de plataforma auxiliar mientras el estado real se decide con Docker Engine y el stack.",
      measuredAt,
      authority: "secondary",
      affectsOverall: false,
    };
  }

  private async getWindowsDockerServiceCheck(): Promise<SupervisorCheck | null> {
    if (process.platform !== "win32") {
      return null;
    }

    const measuredAt = new Date().toISOString();
    const modeResult = await this.dockerServiceConfig.readStartMode();
    if (modeResult.startMode === "missing") {
      return {
        id: "docker-desktop",
        label: "Docker Desktop Service",
        state: "warn",
        detail:
          "No se detectó el servicio Windows com.docker.service. Telemetría auxiliar: no bloquea al stack si Docker Engine sigue operativo.",
        measuredAt,
        authority: "auxiliary",
        affectsOverall: false,
      };
    }

    const isAutomatic =
      modeResult.startMode === "Auto" ||
      modeResult.startMode === "Automatic";
    const isRunning =
      modeResult.state.toLowerCase() === "running";

    let state: SupervisorCheck["state"] = "ok";
    if (!isRunning || !isAutomatic) {
      state = "warn";
    }

    let detail: string;
    if (!isAutomatic) {
      detail = `${DOCKER_SERVICE_STARTMODE_MANUAL}: StartMode=${modeResult.startMode}. Señal auxiliar: no degrada el sistema si Docker Engine y el stack están sanos.`;
    } else if (isRunning) {
      detail = `com.docker.service en ejecución (StartMode=${modeResult.startMode}).`;
    } else {
      detail = `com.docker.service no está en ejecución (estado=${modeResult.state}). Señal auxiliar: puede ocurrir con Docker operativo.`;
    }

    return {
      id: "docker-desktop",
      label: "Docker Desktop Service",
      state,
      detail,
      measuredAt,
      authority: "auxiliary",
      affectsOverall: false,
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
    if (this.shouldDeferElectronScripts()) {
      const reason =
        getSessionStartupGuard()?.getDeferralReason() ??
        "Scripts de Electron diferidos durante arranque de Windows.";
      return { ok: false, output: reason };
    }

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
    if (this.shouldDeferElectronScripts()) {
      const reason =
        getSessionStartupGuard()?.getDeferralReason() ??
        "Consultas Docker diferidas durante arranque de Windows.";
      return { ok: false, output: reason };
    }

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
