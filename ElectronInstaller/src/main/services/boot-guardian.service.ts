import fs from "node:fs/promises";
import path from "node:path";

import { app } from "electron";
import type { BrowserWindow } from "electron";

import type {
  HealthUpdateEvent,
  ServiceHealth,
  WatchdogState,
} from "@shared/contracts";
import { IPCChannels } from "@shared/ipc-channels";

import { DockerAutostartService } from "./docker-autostart.service";
import { DockerOrchestratorService } from "./docker-orchestrator.service";
import { GuardianStateService } from "./guardian-state.service";
import { ProcessRunnerService } from "./process-runner.service";

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
}

type RecoveryLevel = 1 | 2 | 3;

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
  private readonly processRunner = new ProcessRunnerService();
  private readonly dockerOrchestrator = new DockerOrchestratorService();
  private readonly dockerAutostart = new DockerAutostartService();
  private readonly guardianState = new GuardianStateService();
  private readonly onLog: (message: string) => void;
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
  private currentWatchdogState: WatchdogState = "idle";
  private cycleInProgress = false;

  constructor(options: BootGuardianOptions) {
    this.onLog = options.onLog;
    this.baseIntervalMs = options.baseHealthCheckIntervalMs ?? 30_000;
    this.maxIntervalMs = options.maxHealthCheckIntervalMs ?? 1_800_000;
    this.maxRetriesPerLevel = options.maxRetriesPerLevel ?? 3;
    this.enableDockerAutostart = options.enableDockerAutostart ?? true;
    this.dockerStartupTimeoutMs = options.dockerStartupTimeoutMs ?? 120_000;
    this.postResumeDelayMs = options.postResumeDelayMs ?? 20_000;
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
      },
      timestamp: new Date().toISOString(),
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
    this.log("[BOOT-GUARDIAN] Iniciando secuencia de arranque automático...");

    // Recuperar estado previo del disco
    const savedState = await this.guardianState.load();
    this.consecutiveFailures = savedState.consecutiveFailures;
    this.currentRecoveryLevel =
      savedState.lastRecoveryLevel ?? 1;

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

  // ── Docker Desktop ────────────────────────────────────────────

  private async ensureDockerAutostartConfigured(): Promise<void> {
    this.log(
      "[BOOT-GUARDIAN] Verificando configuración de inicio automático de Docker Desktop...",
    );

    try {
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
    if (await this.isDockerEngineReady()) {
      this.log("[BOOT-GUARDIAN] Docker Engine ya está operativo.");
      return true;
    }

    this.log(
      "[BOOT-GUARDIAN] Docker Engine no responde. Intentando iniciar Docker Desktop...",
    );

    const started = await this.tryStartDockerDesktop();
    if (!started) {
      this.log("[BOOT-GUARDIAN] ⚠️ No se pudo lanzar Docker Desktop.");
      return false;
    }

    const checkIntervalMs = 4_000;
    const maxAttempts = Math.max(
      10,
      Math.ceil(this.dockerStartupTimeoutMs / checkIntervalMs),
    );

    const ready = await this.waitForDockerEngine(maxAttempts, checkIntervalMs);

    if (ready) {
      await this.guardianState.update({
        lastDockerDesktopRestart: new Date().toISOString(),
      });
    }

    return ready;
  }

  private async isDockerEngineReady(): Promise<boolean> {
    const result = await this.processRunner.run({
      command: "docker",
      args: ["version", "--format", "{{.Server.Version}}"],
      timeoutMs: 15_000,
    });

    return result.ok;
  }

  /**
   * Intenta arrancar Docker Desktop de forma multiplataforma.
   */
  private async tryStartDockerDesktop(): Promise<boolean> {
    const platform = process.platform;

    if (platform === "win32") {
      return this.tryStartDockerDesktopWindows();
    }

    if (platform === "darwin") {
      return this.tryStartDockerDesktopMacOS();
    }

    if (platform === "linux") {
      return this.tryStartDockerDesktopLinux();
    }

    this.log(
      `[BOOT-GUARDIAN] Plataforma no soportada para arranque de Docker Desktop: ${platform}`,
    );
    return false;
  }

  private async tryStartDockerDesktopWindows(): Promise<boolean> {
    const candidatePaths = [
      "C:/Program Files/Docker/Docker/Docker Desktop.exe",
      "C:/Program Files/Docker/Docker/Docker Desktop",
    ];

    for (const executablePath of candidatePaths) {
      const result = await this.processRunner.run({
        command: "powershell",
        args: [
          "-NoProfile",
          "-Command",
          `if (Test-Path '${executablePath}') { Start-Process -FilePath '${executablePath}'; exit 0 } else { exit 1 }`,
        ],
        timeoutMs: 15_000,
      });

      if (result.ok) {
        this.log(
          "[BOOT-GUARDIAN] Docker Desktop lanzado (Windows). Esperando engine...",
        );
        return true;
      }
    }

    return false;
  }

  private async tryStartDockerDesktopMacOS(): Promise<boolean> {
    // Intentar abrir Docker Desktop via open (aplicación .app)
    const result = await this.processRunner.run({
      command: "open",
      args: ["-a", "Docker"],
      timeoutMs: 15_000,
    });

    if (result.ok) {
      this.log(
        "[BOOT-GUARDIAN] Docker Desktop lanzado (macOS). Esperando engine...",
      );
      return true;
    }

    // Fallback: intentar abrir la ruta completa
    const fallback = await this.processRunner.run({
      command: "open",
      args: ["/Applications/Docker.app"],
      timeoutMs: 15_000,
    });

    if (fallback.ok) {
      this.log(
        "[BOOT-GUARDIAN] Docker Desktop lanzado via path directo (macOS). Esperando engine...",
      );
      return true;
    }

    return false;
  }

  private async tryStartDockerDesktopLinux(): Promise<boolean> {
    // Linux: intentar arrancar el servicio Docker daemon via systemctl
    const systemctlResult = await this.processRunner.run({
      command: "systemctl",
      args: ["start", "docker"],
      timeoutMs: 30_000,
    });

    if (systemctlResult.ok) {
      this.log(
        "[BOOT-GUARDIAN] Servicio Docker iniciado via systemctl (Linux). Esperando engine...",
      );
      return true;
    }

    // Fallback: intentar con service
    const serviceResult = await this.processRunner.run({
      command: "sudo",
      args: ["service", "docker", "start"],
      timeoutMs: 30_000,
    });

    if (serviceResult.ok) {
      this.log(
        "[BOOT-GUARDIAN] Servicio Docker iniciado via service (Linux). Esperando engine...",
      );
      return true;
    }

    // Último recurso: Docker Desktop para Linux
    const desktopResult = await this.processRunner.run({
      command: "systemctl",
      args: ["--user", "start", "docker-desktop"],
      timeoutMs: 30_000,
    });

    if (desktopResult.ok) {
      this.log(
        "[BOOT-GUARDIAN] Docker Desktop iniciado (Linux). Esperando engine...",
      );
      return true;
    }

    return false;
  }

  private async waitForDockerEngine(
    maxAttempts: number,
    delayMs: number,
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (await this.isDockerEngineReady()) {
        this.log(
          `[BOOT-GUARDIAN] Docker Engine operativo (intento ${attempt}/${maxAttempts}) ✅`,
        );
        return true;
      }

      if (attempt < maxAttempts) {
        await this.delay(delayMs);
      }
    }

    this.log(
      `[BOOT-GUARDIAN] Docker Engine no respondió después de ${maxAttempts} intentos.`,
    );
    return false;
  }

  // ── Graduated Recovery ────────────────────────────────────────

  /**
   * Verifica salud y aplica recuperación graduada:
   * - Nivel 1: restart solo de servicios unhealthy.
   * - Nivel 2: docker compose up -d (ligero, sin --build ni --force-recreate).
   * - Nivel 3: full startStack (down + up --build --force-recreate).
   */
  private async ensureStackHealthy(runtimePath: string): Promise<void> {
    const healthResult = await this.dockerOrchestrator.getHealth(runtimePath);

    await this.guardianState.update({
      lastHealthCheck: new Date().toISOString(),
    });

    if (healthResult.ok && healthResult.data) {
      this.lastHealth = healthResult.data;
      this.broadcastHealth();

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
    this.updateWatchdogState("recovering");

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
  }

  /**
   * Nivel 1: Reinicia solo los servicios individuales que están unhealthy.
   */
  private async performRecoveryLevel1(
    runtimePath: string,
    downServices: ServiceHealth[],
  ): Promise<boolean> {
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

    this.log(
      `[BOOT-GUARDIAN] ⚠️ Nivel 2 fallido: ${result.message}`,
    );
    return false;
  }

  /**
   * Nivel 3: Full startStack (down + up --build --force-recreate).
   */
  private async performRecoveryLevel3(runtimePath: string): Promise<boolean> {
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

    this.log(
      `[BOOT-GUARDIAN] ⚠️ Nivel 3 fallido: ${result.message}`,
    );
    return false;
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

    const exponentialDelay =
      this.baseIntervalMs * Math.pow(2, this.consecutiveFailures);
    return Math.min(exponentialDelay, this.maxIntervalMs);
  }

  private async watchdogCycle(): Promise<void> {
    if (!this.running || !this.runtimePath || this.cycleInProgress) {
      return;
    }

    this.cycleInProgress = true;

    try {
      // Verificar Docker Engine de forma independiente del stack
      const dockerReady = await this.isDockerEngineReady();
      if (!dockerReady) {
        this.log(
          "[BOOT-GUARDIAN] Docker Engine no responde. Intentando reiniciar...",
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
      this.mainWindow.webContents.send(
        IPCChannels.runtime.healthUpdate,
        event,
      );
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

  // ── Utilidades ────────────────────────────────────────────────

  private log(message: string): void {
    this.onLog(message);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
