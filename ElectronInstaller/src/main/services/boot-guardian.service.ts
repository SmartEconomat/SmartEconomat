import fs from "node:fs/promises";
import path from "node:path";

import { app } from "electron";

import type { ServiceHealth } from "@shared/contracts";

import { DockerAutostartService } from "./docker-autostart.service";
import { DockerOrchestratorService } from "./docker-orchestrator.service";
import { ProcessRunnerService } from "./process-runner.service";

interface BootGuardianOptions {
  onLog: (message: string) => void;
  /**
   * Intervalo en ms para verificar salud de contenedores.
   * Por defecto 60 000 (1 minuto).
   */
  healthCheckIntervalMs?: number;
  /**
   * Máximo de reintentos consecutivos de arranque antes de pausar vigilancia.
   * Por defecto 3.
   */
  maxConsecutiveStartRetries?: number;
  /**
   * Habilitar configuración automática de Docker Desktop para iniciar con Windows.
   * Por defecto true.
   */
  enableDockerAutostart?: boolean;
  /**
   * Tiempo máximo de espera para que Docker Desktop arranque (ms).
   * Por defecto 120000 (2 minutos).
   */
  dockerStartupTimeoutMs?: number;
}

/**
 * Servicio que garantiza la alta disponibilidad del stack Docker tras el
 * arranque del sistema.
 *
 * Responsabilidades:
 * 1. Configurar Docker Desktop para iniciar automáticamente con Windows.
 * 2. Asegurar que Docker Desktop esté corriendo.
 * 3. Levantar automáticamente los contenedores del proyecto.
 * 4. Vigilar periódicamente que los contenedores sigan operativos.
 */
export class BootGuardianService {
  private readonly processRunner = new ProcessRunnerService();
  private readonly dockerOrchestrator = new DockerOrchestratorService();
  private readonly dockerAutostart = new DockerAutostartService();
  private readonly onLog: (message: string) => void;
  private readonly healthCheckIntervalMs: number;
  private readonly maxConsecutiveStartRetries: number;
  private readonly enableDockerAutostart: boolean;
  private readonly dockerStartupTimeoutMs: number;

  private watchdogTimer: ReturnType<typeof setInterval> | null = null;
  private consecutiveFailures = 0;
  private running = false;

  constructor(options: BootGuardianOptions) {
    this.onLog = options.onLog;
    this.healthCheckIntervalMs = options.healthCheckIntervalMs ?? 60_000;
    this.maxConsecutiveStartRetries = options.maxConsecutiveStartRetries ?? 3;
    this.enableDockerAutostart = options.enableDockerAutostart ?? true;
    this.dockerStartupTimeoutMs = options.dockerStartupTimeoutMs ?? 120_000;
  }

  /**
   * Ejecuta la secuencia completa de arranque automático:
   * 1. Verifica y configura Docker Desktop para inicio automático.
   * 2. Resuelve la ruta runtime de la instalación.
   * 3. Espera a que Docker Desktop esté operativo.
   * 4. Levanta el stack si no está corriendo.
   * 5. Inicia el watchdog periódico.
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

    // Configurar Docker Desktop para inicio automático si está habilitado
    if (this.enableDockerAutostart) {
      await this.ensureDockerAutostartConfigured();
    }

    const runtimePath = await this.resolveRuntimePath();
    if (!runtimePath) {
      this.log(
        "[BOOT-GUARDIAN] No se detectó una instalación válida. El guardian se desactiva.",
      );
      this.running = false;
      return;
    }

    this.log(`[BOOT-GUARDIAN] Ruta runtime detectada: ${runtimePath}`);

    const dockerReady = await this.ensureDockerDesktopRunning();
    if (!dockerReady) {
      this.log(
        "[BOOT-GUARDIAN] ⚠️ Docker Desktop no pudo ser iniciado. Se reintentará en el próximo ciclo del watchdog.",
      );
    }

    if (dockerReady) {
      await this.ensureStackRunning(runtimePath);
    }

    this.startWatchdog(runtimePath);
    this.log("[BOOT-GUARDIAN] Watchdog de alta disponibilidad activado ✅");
  }

  /**
   * Detiene el watchdog y libera recursos.
   */
  stop(): void {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }

    this.running = false;
    this.log("[BOOT-GUARDIAN] Watchdog detenido.");
  }

  // ── Docker Desktop ────────────────────────────────────────────

  /**
   * Verifica y configura Docker Desktop para iniciar automáticamente con Windows.
   */
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
        "[BOOT-GUARDIAN] Configurando Docker Desktop para iniciar automáticamente con Windows...",
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
   * Verifica si Docker Engine responde. Si no, intenta arrancar Docker Desktop
   * y espera hasta que el engine esté disponible.
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

    // Calcular intentos basados en el timeout configurado (con intervalo de 4 segundos)
    const checkIntervalMs = 4_000;
    const maxAttempts = Math.max(
      10,
      Math.ceil(this.dockerStartupTimeoutMs / checkIntervalMs),
    );

    return this.waitForDockerEngine(maxAttempts, checkIntervalMs);
  }

  private async isDockerEngineReady(): Promise<boolean> {
    const result = await this.processRunner.run({
      command: "docker",
      args: ["version", "--format", "{{.Server.Version}}"],
      timeoutMs: 15_000,
    });

    return result.ok;
  }

  private async tryStartDockerDesktop(): Promise<boolean> {
    if (process.platform !== "win32") {
      return false;
    }

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
          "[BOOT-GUARDIAN] Docker Desktop lanzado. Esperando a que el engine arranque...",
        );
        return true;
      }
    }

    return false;
  }

  /**
   * Espera hasta que Docker Engine responda, con reintentos configurables.
   */
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

  // ── Stack Docker Compose ──────────────────────────────────────

  /**
   * Verifica si todos los contenedores están healthy/running.
   * Si alguno está caído o no existen, inicia el stack.
   */
  private async ensureStackRunning(runtimePath: string): Promise<void> {
    const healthResult = await this.dockerOrchestrator.getHealth(runtimePath);

    if (healthResult.ok && healthResult.data) {
      const allHealthy = this.areAllServicesUp(healthResult.data);
      if (allHealthy) {
        this.log("[BOOT-GUARDIAN] Todos los servicios ya están operativos ✅");
        this.consecutiveFailures = 0;
        return;
      }

      const downServices = healthResult.data
        .filter(
          (service) =>
            service.status === "unhealthy" || service.status === "unknown",
        )
        .map((service) => service.service);

      if (downServices.length > 0) {
        this.log(
          `[BOOT-GUARDIAN] Servicios con incidencia: ${downServices.join(", ")}. Reiniciando stack...`,
        );
      }
    } else {
      this.log(
        "[BOOT-GUARDIAN] No se pudo obtener salud de servicios. Levantando stack...",
      );
    }

    await this.startStack(runtimePath);
  }

  private async startStack(runtimePath: string): Promise<void> {
    this.log("[BOOT-GUARDIAN] Iniciando stack Docker Compose...");

    const result = await this.dockerOrchestrator.startStack(
      runtimePath,
      (event) => {
        this.log(`[DOCKER] ${event.line}`);
      },
    );

    if (result.ok) {
      this.log("[BOOT-GUARDIAN] Stack iniciado correctamente ✅");
      this.consecutiveFailures = 0;
    } else {
      this.consecutiveFailures++;
      this.log(
        `[BOOT-GUARDIAN] ⚠️ Error al iniciar stack: ${result.message} (fallo ${this.consecutiveFailures}/${this.maxConsecutiveStartRetries})`,
      );
    }
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

  // ── Watchdog ──────────────────────────────────────────────────

  private startWatchdog(runtimePath: string): void {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
    }

    this.watchdogTimer = setInterval(() => {
      void this.watchdogCycle(runtimePath);
    }, this.healthCheckIntervalMs);
  }

  private async watchdogCycle(runtimePath: string): Promise<void> {
    if (this.consecutiveFailures >= this.maxConsecutiveStartRetries) {
      this.log(
        `[BOOT-GUARDIAN] ⚠️ Se alcanzó el máximo de reintentos consecutivos (${this.maxConsecutiveStartRetries}). Watchdog en pausa hasta próximo reinicio o intervención manual.`,
      );
      this.stop();
      return;
    }

    const dockerReady = await this.isDockerEngineReady();
    if (!dockerReady) {
      this.log(
        "[BOOT-GUARDIAN] Docker Engine no responde. Intentando reiniciar Docker Desktop...",
      );
      const started = await this.ensureDockerDesktopRunning();
      if (!started) {
        this.consecutiveFailures++;
        return;
      }
    }

    await this.ensureStackRunning(runtimePath);
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
        : "/tmp/smarteconomat-runtime";

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
