import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import { randomUUID } from "node:crypto";

import { Notification, app } from "electron";
import type { BrowserWindow } from "electron";

import type {
  DockerRuntimeStatus,
  HealthUpdateEvent,
  RecoveryLevel,
  ServiceHealth,
  SupervisorCheck,
  SupervisorIncident,
  SupervisorSnapshot,
  WatchdogState,
} from "@shared/contracts";
import { IPCChannels } from "@shared/ipc-channels";

import { DockerAutostartService } from "./docker-autostart.service";
import { DockerOrchestratorService } from "./docker-orchestrator.service";
import { DockerReadinessService } from "./docker-readiness.service";
import { GuardianStateService } from "./guardian-state.service";
import { ProcessRunnerService } from "./process-runner.service";
import { SupervisorLogService } from "./supervisor-log.service";
import { computeBackoffInterval, shouldRunRecovery } from "./supervisor-policy";

export interface BootGuardianOptions {
  onLog: (message: string) => void;
  /**
   * Intervalo base en ms para verificar salud de contenedores.
   * Se usa como base para el backoff exponencial. Por defecto 30 000 (30 s).
   */
  baseHealthCheckIntervalMs?: number;
  /**
   * Intervalo máximo en ms para el backoff exponencial. Por defecto 1 800 000 (30 min).
   */
  maxHealthCheckIntervalMs?: number;
  /**
   * Máximo de reintentos por nivel de recuperación antes de escalar.
   * Por defecto 3.
   */
  maxRetriesPerLevel?: number;
  /**
   * Habilitar configuración automática de Docker Desktop para iniciar con el SO.
   * Por defecto true.
   */
  enableDockerAutostart?: boolean;
  /**
   * Tiempo máximo de espera para que Docker Desktop arranque (ms).
   * Por defecto 120 000 (2 minutos).
   */
  dockerStartupTimeoutMs?: number;
  /**
   * Delay en ms después de un resume del SO antes de verificar salud.
   * Por defecto 20 000 (20 s).
   */
  postResumeDelayMs?: number;
  onSnapshot?: (snapshot: SupervisorSnapshot) => void;
  onTrayStateChange?: (state: "healthy" | "recovering" | "degraded") => void;
}

/**
 * Servicio que garantiza la alta disponibilidad del stack Docker.
 *
 * Mejoras sobre la versión anterior:
 * - Recuperación graduada en 3 niveles (restart service → stack up → full recreate).
 * - Backoff exponencial: el watchdog NUNCA se detiene permanentemente.
 * - Soporte multi-OS para arrancar Docker Desktop (Windows, macOS, Linux).
 * - Persistencia de estado en disco (sobrevive a reinicios de Electron).
 * - Health broadcast al renderer via IPC push.
 * - Preparado para eventos de power (sleep/resume) inyectados desde index.ts.
 */
export class BootGuardianService {
  private readonly dockerOrchestrator = new DockerOrchestratorService();
  private readonly dockerAutostart = new DockerAutostartService();
  private readonly dockerReadiness = new DockerReadinessService();
  private readonly guardianState = new GuardianStateService();
  private readonly supervisorLog = new SupervisorLogService();
  private readonly processRunner = new ProcessRunnerService();
  private readonly onLog: (message: string) => void;
  private readonly onSnapshot?: (snapshot: SupervisorSnapshot) => void;
  private readonly onTrayStateChange?: (
    state: "healthy" | "recovering" | "degraded",
  ) => void;
  private readonly baseIntervalMs: number;
  private readonly maxIntervalMs: number;
  private readonly maxRetriesPerLevel: number;
  private readonly enableDockerAutostart: boolean;
  private readonly dockerStartupTimeoutMs: number;
  private readonly postResumeDelayMs: number;

  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private consecutiveFailures = 0;
  private currentRecoveryLevel: RecoveryLevel = 1;
  private running = false;
  private runtimePath: string | null = null;
  private mainWindow: BrowserWindow | null = null;
  private lastHealth: ServiceHealth[] = [];
  private lastDockerStatus: DockerRuntimeStatus = {
    state: "daemon-starting",
    detail: "Aún no verificado.",
    source: "boot-guardian",
    retries: 0,
    lastCheckedAt: new Date().toISOString(),
  };
  private currentWatchdogState: WatchdogState = "idle";
  private cycleInProgress = false;
  private recoveryLock = false;
  private startedAtMs = Date.now();
  private supervisorChecks: SupervisorCheck[] = [];
  private lastAutomaticActionAt: string | null = null;
  private lastAutomaticAction: string | null = null;
  private lastRecoveryAttemptAt = 0;
  private readonly minimumRecoveryCooldownMs = 20_000;
  private incidentsByKey = new Map<string, SupervisorIncident>();
  private incidentsResolved = 0;
  private lastIncidentAt: string | null = null;

  constructor(options: BootGuardianOptions) {
    this.onLog = options.onLog;
    this.baseIntervalMs = options.baseHealthCheckIntervalMs ?? 30_000;
    this.maxIntervalMs = options.maxHealthCheckIntervalMs ?? 1_800_000;
    this.maxRetriesPerLevel = options.maxRetriesPerLevel ?? 3;
    this.enableDockerAutostart = options.enableDockerAutostart ?? true;
    this.dockerStartupTimeoutMs = options.dockerStartupTimeoutMs ?? 120_000;
    this.postResumeDelayMs = options.postResumeDelayMs ?? 20_000;
    this.onSnapshot = options.onSnapshot;
    this.onTrayStateChange = options.onTrayStateChange;
  }

  /**
   * Permite al proceso principal inyectar la ventana para health push.
   */
  setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  /**
   * Retorna el estado actual del watchdog para consultas on-demand.
   */
  getStatus(): HealthUpdateEvent {
    return {
      health: this.lastHealth,
      watchdog: {
        state: this.currentWatchdogState,
        consecutiveFailures: this.consecutiveFailures,
        currentRecoveryLevel: this.currentRecoveryLevel,
        nextCheckInMs: this.computeCurrentInterval(),
        lastCheck: this.guardianState.get().lastHealthCheck,
        dockerStatus: this.lastDockerStatus,
      },
      supervisorSnapshot: this.getSupervisorSnapshot(),
      timestamp: new Date().toISOString(),
    };
  }

  getSupervisorSnapshot(): SupervisorSnapshot {
    const now = Date.now();
    const hasErrors = this.supervisorChecks.some(
      (check) => check.state === "error",
    );
    const hasWarnings = this.supervisorChecks.some(
      (check) => check.state === "warn",
    );
    const overallState = hasErrors
      ? "degraded"
      : this.currentWatchdogState === "recovering"
        ? "recovering"
        : hasWarnings
          ? "recovering"
          : "healthy";

    const incidents = [...this.incidentsByKey.values()].sort((a, b) =>
      b.detectedAt.localeCompare(a.detectedAt),
    );
    const openIncidents = incidents.filter(
      (incident) => incident.state === "open",
    );

    return {
      overallState,
      checks: this.supervisorChecks,
      lastAutomaticActionAt: this.lastAutomaticActionAt,
      lastAutomaticAction: this.lastAutomaticAction,
      uptimeSeconds: Math.max(0, Math.floor((now - this.startedAtMs) / 1000)),
      nextCheckInMs: this.computeCurrentInterval(),
      incidentsResolved: this.incidentsResolved,
      incidentsOpen: openIncidents.length,
      lastIncidentAt: this.lastIncidentAt,
      latestIncident: incidents[0] ?? null,
      recentIncidents: incidents.slice(0, 8),
    };
  }

  /**
   * Ejecuta la secuencia completa de arranque automático:
   * 1. Carga estado persistido previo.
   * 2. Verifica y configura Docker Desktop para inicio automático.
   * 3. Resuelve la ruta runtime de la instalación.
   * 4. Espera a que Docker Desktop esté operativo.
   * 5. Levanta el stack si no está corriendo.
   * 6. Inicia el watchdog periódico con backoff exponencial.
   */
  async bootstrap(): Promise<void> {
    if (this.running) {
      this.log(
        "[BOOT-GUARDIAN] Ya se encuentra en ejecución, ignorando llamada duplicada.",
      );
      return;
    }

    this.running = true;
    this.startedAtMs = Date.now();
    this.log("[BOOT-GUARDIAN] Iniciando secuencia de arranque automático...");

    // Recuperar estado previo del disco
    const savedState = await this.guardianState.load();
    this.consecutiveFailures = savedState.consecutiveFailures;
    this.currentRecoveryLevel = savedState.lastRecoveryLevel ?? 1;
    this.lastDockerStatus = {
      state: savedState.lastDockerState,
      detail:
        savedState.lastDockerDetail || "Estado cargado desde persistencia.",
      source: "boot-guardian",
      retries: 0,
      lastCheckedAt: new Date().toISOString(),
    };

    if (this.enableDockerAutostart) {
      await this.ensureDockerAutostartConfigured();
    }

    const resolvedPath = await this.resolveRuntimePath();
    if (!resolvedPath) {
      this.log(
        "[BOOT-GUARDIAN] No se detectó una instalación válida. El guardian se desactiva.",
      );
      this.running = false;
      return;
    }

    this.runtimePath = resolvedPath;
    this.log(`[BOOT-GUARDIAN] Ruta runtime detectada: ${resolvedPath}`);

    const dockerReady = await this.ensureDockerDesktopRunning();
    if (!dockerReady) {
      this.log(
        "[BOOT-GUARDIAN] ⚠️ Docker Desktop no pudo ser iniciado. Se reintentará en el próximo ciclo del watchdog.",
      );
    }

    if (dockerReady) {
      await this.ensureStackHealthy(resolvedPath);
      await this.refreshSupervisorChecks(resolvedPath);
    }

    this.scheduleNextWatchdogCycle();
    this.log("[BOOT-GUARDIAN] Watchdog de alta disponibilidad activado ✅");
  }

  /**
   * Detiene el watchdog y libera recursos.
   */
  stop(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }

    this.running = false;
    this.updateWatchdogState("idle");
    this.log("[BOOT-GUARDIAN] Watchdog detenido.");
  }

  /**
   * Llamado desde index.ts cuando el SO se reanuda tras sleep/hibernate.
   * Espera un delay prudencial y luego fuerza un ciclo de health check.
   */
  async onSystemResume(): Promise<void> {
    if (!this.running || !this.runtimePath) {
      return;
    }

    this.log(
      `[BOOT-GUARDIAN] Sistema reanudado. Esperando ${Math.round(this.postResumeDelayMs / 1000)}s antes de verificar salud...`,
    );
    await this.delay(this.postResumeDelayMs);

    this.log(
      "[BOOT-GUARDIAN] Ejecutando verificación post-resume del sistema...",
    );
    await this.watchdogCycle();
  }

  /**
   * Llamado desde index.ts cuando el SO entra en suspensión.
   */
  onSystemSuspend(): void {
    this.log(
      "[BOOT-GUARDIAN] Sistema entrando en suspensión. Registrando evento.",
    );
  }

  async restartDockerDesktopNow(): Promise<boolean> {
    const ready = await this.ensureDockerDesktopRunning();
    if (ready && this.runtimePath) {
      await this.ensureStackHealthy(this.runtimePath);
      await this.refreshSupervisorChecks(this.runtimePath);
    }
    return ready;
  }

  async runRecoveryNow(): Promise<void> {
    if (!this.runtimePath) {
      return;
    }
    await this.ensureStackHealthy(this.runtimePath);
    await this.refreshSupervisorChecks(this.runtimePath);
  }

  // ── Docker Desktop ────────────────────────────────────────────

  private async ensureDockerAutostartConfigured(): Promise<void> {
    this.log(
      "[BOOT-GUARDIAN] Verificando configuración de inicio automático de Docker Desktop...",
    );

    try {
      if (process.platform === "win32") {
        this.log(
          "[BOOT-GUARDIAN] Garantizando estado del servicio de Windows com.docker.service...",
        );
        const serviceResult =
          await this.dockerAutostart.ensureDockerServiceActive();
        if (!serviceResult.ok) {
          this.log(
            `[BOOT-GUARDIAN] ⚠️ Aviso sobre el servicio Docker: ${serviceResult.message}`,
          );
        } else {
          this.log(`[BOOT-GUARDIAN] ${serviceResult.message}`);
        }
      }

      const status = await this.dockerAutostart.getAutostartStatus();

      if (!status.dockerDesktopInstalled) {
        this.log(
          "[BOOT-GUARDIAN] ⚠️ Docker Desktop no está instalado. No se puede configurar inicio automático.",
        );
        return;
      }

      if (status.autoStartEnabled) {
        this.log(
          "[BOOT-GUARDIAN] Docker Desktop ya está configurado para inicio automático ✅",
        );
        return;
      }

      this.log(
        "[BOOT-GUARDIAN] Configurando Docker Desktop para iniciar automáticamente...",
      );

      const configResult = await this.dockerAutostart.enableAutostart();

      if (configResult.ok) {
        this.log(
          "[BOOT-GUARDIAN] Docker Desktop configurado para inicio automático ✅",
        );
      } else {
        this.log(
          `[BOOT-GUARDIAN] ⚠️ ${configResult.message}. Esto puede requerir intervención manual.`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log(
        `[BOOT-GUARDIAN] ⚠️ Error al configurar inicio automático: ${errorMessage}`,
      );
    }
  }

  /**
   * Verifica si Docker Engine responde. Si no, intenta arrancarlo según la
   * plataforma (Windows, macOS, Linux) y espera hasta que esté disponible.
   */
  private async ensureDockerDesktopRunning(): Promise<boolean> {
    const initialProbe = await this.dockerReadiness.probe({
      source: "boot-guardian",
      timeoutMs: 12_000,
    });
    this.lastDockerStatus = initialProbe;
    await this.guardianState.update({
      lastDockerState: initialProbe.state,
      lastDockerDetail: initialProbe.detail,
    });

    if (initialProbe.state === "daemon-ready") {
      this.log("[BOOT-GUARDIAN] Docker Engine ya está operativo.");
      return true;
    }

    if (initialProbe.state === "not-installed") {
      this.log("[BOOT-GUARDIAN] Docker no está instalado en el host.");
      return false;
    }

    this.log(
      "[BOOT-GUARDIAN] Docker Engine no responde. Intentando iniciar Docker Desktop...",
    );

    const started =
      await this.dockerReadiness.startDockerDesktop("boot-guardian");
    this.lastDockerStatus = started;
    await this.guardianState.update({
      lastDockerState: started.state,
      lastDockerDetail: started.detail,
    });

    if (started.state === "daemon-error") {
      this.log(`[BOOT-GUARDIAN] ⚠️ ${started.detail}`);
      return false;
    }

    const waited = await this.dockerReadiness.waitUntilReady({
      maxWaitMs: this.dockerStartupTimeoutMs,
      initialDelayMs: 2_000,
      maxDelayMs: 10_000,
      source: "boot-guardian",
    });
    const ready = waited.state === "daemon-ready";
    this.lastDockerStatus = waited;
    await this.guardianState.update({
      lastDockerState: waited.state,
      lastDockerDetail: waited.detail,
    });

    if (ready) {
      await this.guardianState.update({
        lastDockerDesktopRestart: new Date().toISOString(),
      });
    } else {
      this.log(`[BOOT-GUARDIAN] ⚠️ ${waited.detail}`);
    }

    return ready;
  }

  // ── Graduated Recovery ────────────────────────────────────────

  /**
   * Verifica salud y aplica recuperación graduada:
   * - Nivel 1: reinicio de servicio puntual.
   * - Nivel 2: docker compose up -d.
   * - Nivel 3: recreate completo.
   * - Nivel 4: prune + recreate.
   * - Nivel 5: reinicio Docker Desktop.
   * - Nivel 6: escalado a intervención guiada.
   */
  private async ensureStackHealthy(runtimePath: string): Promise<void> {
    const healthResult = await this.dockerOrchestrator.getHealth(runtimePath);

    await this.guardianState.update({
      lastHealthCheck: new Date().toISOString(),
    });

    if (healthResult.ok && healthResult.data) {
      this.lastHealth = healthResult.data;
      this.broadcastHealth();

      if (healthResult.data.length === 0) {
        this.log(
          "[BOOT-GUARDIAN] Stack sin contenedores activos detectado. Escalando recuperación automática (nivel 2).",
        );
        if (this.currentRecoveryLevel < 2) {
          this.currentRecoveryLevel = 2;
        }
        this.registerCriticalIncident(
          "compose-stack-empty",
          "Docker Compose stack",
          "No se detectaron contenedores activos en el stack.",
        );
        await this.performGraduatedRecovery(runtimePath, []);
        return;
      }

      const allHealthy = this.areAllServicesUp(healthResult.data);
      if (allHealthy) {
        this.log("[BOOT-GUARDIAN] Todos los servicios ya están operativos ✅");
        await this.resetRecoveryState();
        return;
      }

      const downServices = healthResult.data.filter(
        (service) =>
          service.status === "unhealthy" || service.status === "unknown",
      );

      if (downServices.length > 0) {
        this.log(
          `[BOOT-GUARDIAN] Servicios con incidencia: ${downServices.map((s) => s.service).join(", ")}`,
        );
        await this.performGraduatedRecovery(runtimePath, downServices);
      }
    } else {
      this.log(
        "[BOOT-GUARDIAN] No se pudo obtener salud de servicios. Aplicando recuperación nivel 3...",
      );
      this.currentRecoveryLevel = 3;
      await this.performRecoveryLevel3(runtimePath);
    }
  }

  private async performGraduatedRecovery(
    runtimePath: string,
    downServices: ServiceHealth[],
  ): Promise<void> {
    if (this.recoveryLock) {
      this.log(
        "[BOOT-GUARDIAN] Recuperación ya en curso. Se evita ejecutar otra en paralelo.",
      );
      return;
    }
    const nowMs = Date.now();
    if (
      !shouldRunRecovery(
        nowMs,
        this.lastRecoveryAttemptAt,
        this.minimumRecoveryCooldownMs,
      )
    ) {
      const waitMs =
        this.minimumRecoveryCooldownMs - (nowMs - this.lastRecoveryAttemptAt);
      this.log(
        `[BOOT-GUARDIAN] Cooldown activo para reparaciones (${Math.ceil(waitMs / 1000)}s restantes).`,
      );
      return;
    }

    this.recoveryLock = true;
    this.lastRecoveryAttemptAt = nowMs;
    this.updateWatchdogState("recovering");
    try {
      if (this.currentRecoveryLevel === 1) {
        const success = await this.performRecoveryLevel1(
          runtimePath,
          downServices,
        );
        if (success) {
          await this.resetRecoveryState();
          return;
        }
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= this.maxRetriesPerLevel) {
          this.log(
            "[BOOT-GUARDIAN] Nivel 1 agotado. Escalando a nivel 2 (stack restart ligero).",
          );
          this.currentRecoveryLevel = 2;
          this.consecutiveFailures = 0;
        }
      }

      if (this.currentRecoveryLevel === 2) {
        const success = await this.performRecoveryLevel2(runtimePath);
        if (success) {
          await this.resetRecoveryState();
          return;
        }
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= this.maxRetriesPerLevel) {
          this.log(
            "[BOOT-GUARDIAN] Nivel 2 agotado. Escalando a nivel 3 (full recreate).",
          );
          this.currentRecoveryLevel = 3;
          this.consecutiveFailures = 0;
        }
      }

      if (this.currentRecoveryLevel === 3) {
        const success = await this.performRecoveryLevel3(runtimePath);
        if (success) {
          await this.resetRecoveryState();
          return;
        }
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= this.maxRetriesPerLevel) {
          this.log("[BOOT-GUARDIAN] Nivel 3 agotado. Escalando a nivel 4.");
          this.currentRecoveryLevel = 4;
          this.consecutiveFailures = 0;
        }
      }

      if (this.currentRecoveryLevel === 4) {
        const success = await this.performRecoveryLevel4(runtimePath);
        if (success) {
          await this.resetRecoveryState();
          return;
        }
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= this.maxRetriesPerLevel) {
          this.log("[BOOT-GUARDIAN] Nivel 4 agotado. Escalando a nivel 5.");
          this.currentRecoveryLevel = 5;
          this.consecutiveFailures = 0;
        }
      }

      if (this.currentRecoveryLevel === 5) {
        const success = await this.performRecoveryLevel5(runtimePath);
        if (success) {
          await this.resetRecoveryState();
          return;
        }
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= this.maxRetriesPerLevel) {
          this.log("[BOOT-GUARDIAN] Nivel 5 agotado. Escalando a nivel 6.");
          this.currentRecoveryLevel = 6;
          this.consecutiveFailures = 0;
        }
      }

      if (this.currentRecoveryLevel === 6) {
        await this.performRecoveryLevel6();
        this.consecutiveFailures++;
      }

      await this.guardianState.update({
        consecutiveFailures: this.consecutiveFailures,
        lastRecoveryLevel: this.currentRecoveryLevel,
        lastRecoveryAction: new Date().toISOString(),
        watchdogState: "recovering",
      });

      this.updateWatchdogState(
        this.consecutiveFailures >= this.maxRetriesPerLevel
          ? "backoff"
          : "recovering",
      );
    } finally {
      this.recoveryLock = false;
    }
  }

  /**
   * Nivel 1: Reinicia solo los servicios individuales que están unhealthy.
   */
  private async performRecoveryLevel1(
    runtimePath: string,
    downServices: ServiceHealth[],
  ): Promise<boolean> {
    this.markAutomaticAction("Nivel 1: reinicio de contenedor");
    this.log(
      `[BOOT-GUARDIAN] 🔧 Nivel 1: Reiniciando servicios individuales: ${downServices.map((s) => s.service).join(", ")}`,
    );

    let allRecovered = true;

    for (const service of downServices) {
      const result = await this.dockerOrchestrator.restartService(
        runtimePath,
        service.service,
      );

      if (!result.ok) {
        this.log(
          `[BOOT-GUARDIAN] ⚠️ No se pudo reiniciar ${service.service}: ${result.message}`,
        );
        allRecovered = false;
      } else {
        this.log(
          `[BOOT-GUARDIAN] Servicio ${service.service} reiniciado correctamente.`,
        );
      }
    }

    if (allRecovered) {
      // Esperar un poco para que los healthchecks se actualicen
      await this.delay(15_000);
      const postHealth = await this.dockerOrchestrator.getHealth(runtimePath);
      if (postHealth.ok && postHealth.data) {
        this.lastHealth = postHealth.data;
        this.broadcastHealth();
        return this.areAllServicesUp(postHealth.data);
      }
    }

    return false;
  }

  /**
   * Nivel 2: docker compose up -d (sin --build ni --force-recreate).
   */
  private async performRecoveryLevel2(runtimePath: string): Promise<boolean> {
    this.markAutomaticAction("Nivel 2: compose up -d");
    this.log(
      "[BOOT-GUARDIAN] 🔧 Nivel 2: Iniciando stack ligero (up -d sin rebuild)...",
    );

    const result = await this.dockerOrchestrator.softStartStack(
      runtimePath,
      (event) => {
        this.log(`[DOCKER] ${event.line}`);
      },
    );

    if (result.ok) {
      this.log("[BOOT-GUARDIAN] Stack levantado (nivel 2) ✅");
      await this.guardianState.update({
        totalRecoveriesPerformed:
          this.guardianState.get().totalRecoveriesPerformed + 1,
      });
      return true;
    }

    this.log(`[BOOT-GUARDIAN] ⚠️ Nivel 2 fallido: ${result.message}`);
    return false;
  }

  /**
   * Nivel 3: Full startStack (down + up --build --force-recreate).
   */
  private async performRecoveryLevel3(runtimePath: string): Promise<boolean> {
    this.markAutomaticAction("Nivel 3: compose down && up -d --build");
    this.log(
      "[BOOT-GUARDIAN] 🔧 Nivel 3: Recreando stack completo (down + up --build --force-recreate)...",
    );

    const result = await this.dockerOrchestrator.startStack(
      runtimePath,
      (event) => {
        this.log(`[DOCKER] ${event.line}`);
      },
    );

    if (result.ok) {
      this.log("[BOOT-GUARDIAN] Stack recreado (nivel 3) ✅");
      await this.guardianState.update({
        totalRecoveriesPerformed:
          this.guardianState.get().totalRecoveriesPerformed + 1,
      });
      return true;
    }

    this.log(`[BOOT-GUARDIAN] ⚠️ Nivel 3 fallido: ${result.message}`);
    return false;
  }

  private async performRecoveryLevel4(runtimePath: string): Promise<boolean> {
    this.log("[BOOT-GUARDIAN] 🔧 Nivel 4: limpieza docker + recreate...");
    this.markAutomaticAction("Nivel 4: prune + recreate");
    await this.dockerOrchestrator.pruneSafe(runtimePath, "safe");
    return this.performRecoveryLevel3(runtimePath);
  }

  private async performRecoveryLevel5(runtimePath: string): Promise<boolean> {
    this.log("[BOOT-GUARDIAN] 🔧 Nivel 5: reinicio de Docker Desktop...");
    this.markAutomaticAction("Nivel 5: reinicio Docker Desktop");
    const started = await this.ensureDockerDesktopRunning();
    if (!started) {
      return false;
    }
    return this.performRecoveryLevel2(runtimePath);
  }

  private async performRecoveryLevel6(): Promise<void> {
    const title = "SmartEconomat requiere intervención";
    const body =
      "No se pudo recuperar automáticamente el stack Docker. Abre el panel para diagnóstico avanzado.";
    this.log(`[BOOT-GUARDIAN] ⚠️ Nivel 6: ${body}`);
    this.markAutomaticAction("Nivel 6: intervención guiada");
    this.sendNotification(title, body);
    await this.supervisorLog.append({
      at: new Date().toISOString(),
      action: "recovery-level-6",
      outcome: "error",
      userSuggestion: "Abrir panel y ejecutar diagnóstico avanzado.",
    });
  }

  private async resetRecoveryState(): Promise<void> {
    this.consecutiveFailures = 0;
    this.currentRecoveryLevel = 1;
    this.updateWatchdogState("active");
    await this.guardianState.update({
      consecutiveFailures: 0,
      lastRecoveryLevel: null,
      watchdogState: "active",
    });
  }

  private areAllServicesUp(services: ServiceHealth[]): boolean {
    if (services.length === 0) {
      return false;
    }

    return services.every(
      (service) =>
        service.status === "healthy" ||
        service.status === "running" ||
        service.status === "starting",
    );
  }

  // ── Watchdog con backoff exponencial ──────────────────────────

  private scheduleNextWatchdogCycle(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
    }

    const intervalMs = this.computeCurrentInterval();
    this.watchdogTimer = setTimeout(() => {
      void this.watchdogCycle();
    }, intervalMs);
  }

  /**
   * Calcula el intervalo actual con backoff exponencial.
   * Fórmula: min(baseInterval × 2^failures, maxInterval)
   * Reset a baseInterval cuando todos los servicios están healthy.
   */
  private computeCurrentInterval(): number {
    if (this.consecutiveFailures === 0) {
      return this.baseIntervalMs;
    }

    return computeBackoffInterval(
      this.baseIntervalMs,
      this.maxIntervalMs,
      this.consecutiveFailures,
    );
  }

  private async watchdogCycle(): Promise<void> {
    if (!this.running || !this.runtimePath || this.cycleInProgress) {
      return;
    }

    this.cycleInProgress = true;

    try {
      // Verificar Docker Engine de forma independiente del stack
      const dockerProbe = await this.dockerReadiness.probe({
        source: "boot-guardian",
        timeoutMs: 10_000,
      });
      this.lastDockerStatus = dockerProbe;
      await this.guardianState.update({
        lastDockerState: dockerProbe.state,
        lastDockerDetail: dockerProbe.detail,
      });
      const dockerReady = dockerProbe.state === "daemon-ready";
      if (!dockerReady) {
        this.log(
          `[BOOT-GUARDIAN] Docker no listo (${dockerProbe.state}). Intentando recuperación...`,
        );
        const started = await this.ensureDockerDesktopRunning();
        if (!started) {
          this.log(
            "[BOOT-GUARDIAN] ⚠️ Docker Engine sigue sin responder. Se reintentará con backoff.",
          );
          // Docker Desktop failure no escala recovery level del stack
          this.updateWatchdogState("backoff");
          return;
        }
      }

      await this.ensureStackHealthy(this.runtimePath);
      await this.refreshSupervisorChecks(this.runtimePath);
    } finally {
      this.cycleInProgress = false;

      // Siempre programar el siguiente ciclo (el watchdog NUNCA se detiene)
      if (this.running) {
        this.scheduleNextWatchdogCycle();
      }
    }
  }

  // ── Health Broadcast ──────────────────────────────────────────

  private broadcastHealth(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    const event = this.getStatus();
    try {
      this.mainWindow.webContents.send(IPCChannels.runtime.healthUpdate, event);
    } catch {
      // La ventana puede haberse destruido entre la verificación y el envío.
    }
  }

  private updateWatchdogState(state: WatchdogState): void {
    this.currentWatchdogState = state;
    this.broadcastHealth();
  }

  // ── Resolución de ruta runtime ────────────────────────────────

  private async resolveRuntimePath(): Promise<string | null> {
    const markerPath = path.join(
      app.getPath("appData"),
      "SmartEconomatInstaller",
      "runtime-path.txt",
    );

    let runtimePathFromMarker = "";
    try {
      const marker = await fs.readFile(markerPath, "utf8");
      runtimePathFromMarker = marker.trim();
    } catch {
      runtimePathFromMarker = "";
    }

    const fallbackRuntimePath =
      process.platform === "win32"
        ? "C:/SmartEconomatRuntime"
        : process.platform === "darwin"
          ? path.join(
              app.getPath("home"),
              "Library",
              "Application Support",
              "SmartEconomatRuntime",
            )
          : path.join(app.getPath("home"), ".smarteconomat-runtime");

    const candidates = [runtimePathFromMarker, fallbackRuntimePath].filter(
      (value, index, list) =>
        value.trim().length > 0 && list.indexOf(value) === index,
    );

    for (const candidate of candidates) {
      if (await this.hasInstalledRuntimeArtifacts(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  private async hasInstalledRuntimeArtifacts(
    runtimePath: string,
  ): Promise<boolean> {
    const composePath = path.join(
      runtimePath,
      "project",
      "docker-compose.prod.yml",
    );
    const envPath = path.join(runtimePath, ".env.prod");

    try {
      await Promise.all([fs.access(composePath), fs.access(envPath)]);
      return true;
    } catch {
      return false;
    }
  }

  private async refreshSupervisorChecks(runtimePath: string): Promise<void> {
    const now = new Date().toISOString();
    const checks: SupervisorCheck[] = [];
    const dockerStatus = this.lastDockerStatus;

    checks.push({
      id: "docker-desktop",
      label: "Docker Desktop",
      state:
        dockerStatus.state === "desktop-not-running"
          ? "error"
          : dockerStatus.state === "not-installed"
            ? "error"
            : "ok",
      detail: dockerStatus.detail,
      measuredAt: now,
    });
    checks.push({
      id: "docker-engine",
      label: "Docker Engine",
      state: dockerStatus.state === "daemon-ready" ? "ok" : "error",
      detail: dockerStatus.detail,
      measuredAt: now,
    });
    checks.push({
      id: "docker-version",
      label: "docker version",
      state: dockerStatus.state === "daemon-ready" ? "ok" : "warn",
      detail:
        dockerStatus.state === "daemon-ready"
          ? "Comando docker operativo."
          : "Pendiente de disponibilidad del daemon.",
      measuredAt: now,
    });
    checks.push({
      id: "docker-info",
      label: "docker info",
      state: dockerStatus.state === "daemon-ready" ? "ok" : "warn",
      detail:
        dockerStatus.state === "daemon-ready"
          ? "Información del daemon accesible."
          : "Docker info no disponible aún.",
      measuredAt: now,
    });

    const hasContainerInventory = this.lastHealth.length > 0;
    const unhealthyCount = this.lastHealth.filter(
      (service) =>
        service.status === "unhealthy" || service.status === "unknown",
    ).length;
    checks.push({
      id: "containers-running",
      label: "Contenedores running",
      state: !hasContainerInventory
        ? "error"
        : unhealthyCount === 0
          ? "ok"
          : "error",
      detail: !hasContainerInventory
        ? "No se detectaron contenedores del stack."
        : unhealthyCount === 0
          ? "Todos los contenedores requeridos están operativos."
          : `${unhealthyCount} contenedor(es) con incidencia.`,
      measuredAt: now,
    });
    checks.push({
      id: "containers-health",
      label: "Healthchecks",
      state: !hasContainerInventory
        ? "error"
        : unhealthyCount === 0
          ? "ok"
          : "warn",
      detail: !hasContainerInventory
        ? "No hay healthchecks disponibles porque no hay contenedores activos."
        : unhealthyCount === 0
          ? "Healthchecks en estado esperado."
          : "Se detectaron healthchecks degradados.",
      measuredAt: now,
    });

    const envValues = await this.readRuntimeEnv(runtimePath);
    const httpPort = Number(envValues.FRONTEND_HTTP_PORT || 80);
    const httpsPort = Number(envValues.FRONTEND_HTTPS_PORT || 443);
    const domain = (envValues.DOMAIN || "localhost").trim();
    const portChecks = await Promise.all([
      this.isPortReachable("127.0.0.1", httpPort),
      this.isPortReachable("127.0.0.1", httpsPort),
    ]);
    const anyPortUnavailable = portChecks.some((entry) => !entry);
    checks.push({
      id: "ports",
      label: "Puertos del stack",
      state: anyPortUnavailable ? "warn" : "ok",
      detail: anyPortUnavailable
        ? `No todos los puertos están accesibles (${httpPort}/${httpsPort}).`
        : `Puertos ${httpPort}/${httpsPort} accesibles en localhost.`,
      measuredAt: now,
    });

    const httpOk = await this.checkHttpEndpoint(
      `http://${domain}:${httpPort}/`,
    );
    checks.push({
      id: "http-endpoint",
      label: "Endpoint HTTP",
      state: httpOk ? "ok" : "warn",
      detail: httpOk ? "Endpoint HTTP responde." : "Endpoint HTTP no responde.",
      measuredAt: now,
    });
    const httpsOk = await this.checkHttpEndpoint(
      `https://${domain}:${httpsPort}/`,
    );
    checks.push({
      id: "https-endpoint",
      label: "Endpoint HTTPS",
      state: httpsOk ? "ok" : "warn",
      detail: httpsOk
        ? "Endpoint HTTPS responde."
        : "Endpoint HTTPS no responde.",
      measuredAt: now,
    });

    const freeMemRatio = os.freemem() / os.totalmem();
    checks.push({
      id: "memory",
      label: "Memoria disponible",
      state: freeMemRatio < 0.1 ? "error" : freeMemRatio < 0.2 ? "warn" : "ok",
      detail: `Memoria libre ${(freeMemRatio * 100).toFixed(1)}%.`,
      measuredAt: now,
    });
    checks.push({
      id: "cpu",
      label: "Carga CPU",
      state: this.currentWatchdogState === "backoff" ? "warn" : "ok",
      detail:
        this.currentWatchdogState === "backoff"
          ? "El sistema está en backoff por fallos consecutivos."
          : "Sin bloqueo de CPU detectado desde el supervisor.",
      measuredAt: now,
    });
    checks.push({
      id: "disk",
      label: "Espacio en disco",
      state: "ok",
      detail: "Sin señal de espacio crítico detectada por el supervisor.",
      measuredAt: now,
    });
    const composeHealth =
      this.lastHealth.length > 0
        ? this.lastHealth.some((service) => service.status === "unhealthy")
          ? "error"
          : "ok"
        : "warn";
    checks.push({
      id: "compose-stack",
      label: "Docker Compose stack",
      state: composeHealth,
      detail:
        composeHealth === "ok"
          ? "Compose reporta servicios operativos."
          : composeHealth === "warn"
            ? "Stack sin datos de salud todavía."
            : "Hay servicios del stack con incidencias.",
      measuredAt: now,
    });

    const composeAssets = await this.inspectComposeAssets(runtimePath);
    checks.push({
      id: "docker-volumes",
      label: "Volúmenes requeridos",
      state: composeAssets.missingVolumes.length > 0 ? "warn" : "ok",
      detail:
        composeAssets.missingVolumes.length > 0
          ? `Faltan ${composeAssets.missingVolumes.length} volumen(es): ${composeAssets.missingVolumes.join(", ")}`
          : "Volúmenes requeridos detectados.",
      measuredAt: now,
    });
    checks.push({
      id: "docker-network",
      label: "Red Docker",
      state: composeAssets.missingNetworks.length > 0 ? "warn" : "ok",
      detail:
        composeAssets.missingNetworks.length > 0
          ? `Faltan ${composeAssets.missingNetworks.length} red(es): ${composeAssets.missingNetworks.join(", ")}`
          : "Redes requeridas detectadas.",
      measuredAt: now,
    });

    const backendPort = Number(envValues.BACKEND_PORT || 3000);
    const backendOk = await this.checkHttpEndpoint(
      `http://127.0.0.1:${backendPort}/api/v1`,
    );
    checks.push({
      id: "backend-api",
      label: "Backend API local",
      state: backendOk ? "ok" : "error",
      detail: backendOk
        ? "API local responde correctamente."
        : "La API local no responde o devolvió error de conectividad.",
      measuredAt: now,
    });

    const dbReady = await this.verifyDatabaseContainer(runtimePath);
    checks.push({
      id: "database",
      label: "Base de datos",
      state: dbReady ? "ok" : "warn",
      detail: dbReady
        ? "PostgreSQL responde al chequeo pg_isready."
        : "PostgreSQL no respondió a pg_isready.",
      measuredAt: now,
    });

    checks.push({
      id: "reverse-proxy",
      label: "Reverse proxy",
      state: httpsOk ? "ok" : "warn",
      detail: httpsOk
        ? "Proxy HTTPS responde correctamente."
        : "Proxy HTTPS no responde todavía.",
      measuredAt: now,
    });

    const certState = await this.checkCertificatesAndHosts(runtimePath, domain);
    checks.push({
      id: "certificates",
      label: "Certificados locales",
      state: certState.certsOk ? "ok" : "warn",
      detail: certState.certsDetail,
      measuredAt: now,
    });
    checks.push({
      id: "hosts-file",
      label: "Hosts local",
      state: certState.hostsOk ? "ok" : "warn",
      detail: certState.hostsDetail,
      measuredAt: now,
    });

    this.supervisorChecks = checks;
    this.refreshIncidentsFromChecks(checks);
    const snapshot = this.getSupervisorSnapshot();
    this.onSnapshot?.(snapshot);
    this.onTrayStateChange?.(snapshot.overallState);
  }

  private async readRuntimeEnv(
    runtimePath: string,
  ): Promise<Record<string, string>> {
    const envPath = path.join(runtimePath, ".env.prod");
    try {
      const content = await fs.readFile(envPath, "utf8");
      return content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"))
        .reduce<Record<string, string>>((acc, line) => {
          const separator = line.indexOf("=");
          if (separator <= 0) {
            return acc;
          }
          const key = line.slice(0, separator).trim();
          const value = line.slice(separator + 1).trim();
          acc[key] = value;
          return acc;
        }, {});
    } catch {
      return {};
    }
  }

  private async isPortReachable(host: string, port: number): Promise<boolean> {
    if (!Number.isFinite(port) || port <= 0) {
      return false;
    }
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2000);
      socket.once("connect", () => {
        socket.destroy();
        resolve(true);
      });
      socket.once("timeout", () => {
        socket.destroy();
        resolve(false);
      });
      socket.once("error", () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, host);
    });
  }

  private async checkHttpEndpoint(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4_000);
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timer);
      return response.ok || response.status < 500;
    } catch {
      return false;
    }
  }

  private async inspectComposeAssets(runtimePath: string): Promise<{
    missingVolumes: string[];
    missingNetworks: string[];
  }> {
    const baseArgs = [
      "compose",
      "--project-directory",
      path.join(runtimePath, "project"),
      "-f",
      path.join(runtimePath, "project", "docker-compose.prod.yml"),
      "--env-file",
      path.join(runtimePath, ".env.prod"),
    ];
    const volumesResult = await this.processRunner.run({
      command: "docker",
      args: [...baseArgs, "config", "--volumes"],
      timeoutMs: 20_000,
    });
    const networksResult = await this.processRunner.run({
      command: "docker",
      args: [...baseArgs, "config", "--networks"],
      timeoutMs: 20_000,
    });
    const existingVolumes = await this.processRunner.run({
      command: "docker",
      args: ["volume", "ls", "--format", "{{.Name}}"],
      timeoutMs: 20_000,
    });
    const existingNetworks = await this.processRunner.run({
      command: "docker",
      args: ["network", "ls", "--format", "{{.Name}}"],
      timeoutMs: 20_000,
    });

    const requiredVolumes = volumesResult.ok
      ? volumesResult.stdout
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      : [];
    const requiredNetworks = networksResult.ok
      ? networksResult.stdout
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      : [];
    const volumeSet = new Set(
      existingVolumes.stdout.split(/\r?\n/).map((line) => line.trim()),
    );
    const networkSet = new Set(
      existingNetworks.stdout.split(/\r?\n/).map((line) => line.trim()),
    );

    return {
      missingVolumes: requiredVolumes.filter(
        (volume) => !volumeSet.has(volume),
      ),
      missingNetworks: requiredNetworks.filter(
        (network) => !networkSet.has(network),
      ),
    };
  }

  private async verifyDatabaseContainer(runtimePath: string): Promise<boolean> {
    const result = await this.processRunner.run({
      command: "docker",
      args: [
        "compose",
        "--project-directory",
        path.join(runtimePath, "project"),
        "-f",
        path.join(runtimePath, "project", "docker-compose.prod.yml"),
        "--env-file",
        path.join(runtimePath, ".env.prod"),
        "exec",
        "-T",
        "db",
        "pg_isready",
      ],
      timeoutMs: 25_000,
    });
    return result.ok;
  }

  private async checkCertificatesAndHosts(
    runtimePath: string,
    domain: string,
  ): Promise<{
    certsOk: boolean;
    certsDetail: string;
    hostsOk: boolean;
    hostsDetail: string;
  }> {
    const fullchainPath = path.join(runtimePath, "certs", "fullchain.pem");
    const privkeyPath = path.join(runtimePath, "certs", "privkey.pem");
    let certsOk = false;
    try {
      await Promise.all([fs.access(fullchainPath), fs.access(privkeyPath)]);
      certsOk = true;
    } catch {
      certsOk = false;
    }

    if (process.platform !== "win32") {
      return {
        certsOk,
        certsDetail: certsOk
          ? "Certificados locales detectados."
          : "No se encontraron certificados locales esperados.",
        hostsOk: true,
        hostsDetail: "Validación de hosts específica de Windows omitida.",
      };
    }

    const hostsPath = path.join(
      process.env.SystemRoot ?? "C:/Windows",
      "System32",
      "drivers",
      "etc",
      "hosts",
    );
    try {
      const hostsContent = await fs.readFile(hostsPath, "utf8");
      const hostMapped =
        hostsContent.includes(`127.0.0.1 ${domain}`) ||
        hostsContent.includes(`::1 ${domain}`);
      return {
        certsOk,
        certsDetail: certsOk
          ? "Certificados locales detectados."
          : "No se encontraron certificados locales esperados.",
        hostsOk: hostMapped,
        hostsDetail: hostMapped
          ? "Dominio local presente en hosts."
          : "Dominio local no encontrado en hosts de Windows.",
      };
    } catch {
      return {
        certsOk,
        certsDetail: certsOk
          ? "Certificados locales detectados."
          : "No se encontraron certificados locales esperados.",
        hostsOk: false,
        hostsDetail: "No se pudo leer hosts de Windows.",
      };
    }
  }

  private refreshIncidentsFromChecks(checks: SupervisorCheck[]): void {
    const now = new Date().toISOString();
    const activeKeys = new Set<string>();
    for (const check of checks) {
      if (check.state === "ok") {
        continue;
      }
      const key = `${check.id}:${check.state}`;
      activeKeys.add(key);
      const existing = this.incidentsByKey.get(key);
      if (!existing) {
        const severity = check.state === "error" ? "error" : ("warn" as const);
        this.incidentsByKey.set(key, {
          id: randomUUID(),
          service: check.id,
          title: check.label,
          detail: check.detail,
          severity,
          state: "open",
          detectedAt: now,
          occurrences: 1,
        });
        this.lastIncidentAt = now;
      } else {
        existing.detail = check.detail;
        existing.occurrences += 1;
      }
    }

    for (const [key, incident] of this.incidentsByKey.entries()) {
      if (incident.state === "open" && !activeKeys.has(key)) {
        incident.state = "resolved";
        incident.resolvedAt = now;
        this.incidentsResolved += 1;
      }
    }
  }

  private registerCriticalIncident(
    key: string,
    title: string,
    detail: string,
  ): void {
    const now = new Date().toISOString();
    const existing = this.incidentsByKey.get(key);
    if (existing) {
      existing.state = "open";
      existing.detail = detail;
      existing.occurrences += 1;
      return;
    }
    this.incidentsByKey.set(key, {
      id: randomUUID(),
      service: key,
      title,
      detail,
      severity: "critical",
      state: "open",
      detectedAt: now,
      occurrences: 1,
    });
    this.lastIncidentAt = now;
  }

  // ── Utilidades ────────────────────────────────────────────────

  private log(message: string): void {
    this.onLog(message);
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

  private markAutomaticAction(action: string): void {
    this.lastAutomaticAction = action;
    this.lastAutomaticActionAt = new Date().toISOString();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
