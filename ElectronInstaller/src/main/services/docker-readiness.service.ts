import type { CommandResult, DockerRuntimeStatus } from "@shared/contracts";

import { resolveWindowsDockerDesktopExePath } from "./docker-desktop-windows-resolve";
import { ProcessRunnerService } from "./process-runner.service";

/** Contrato tipado público (DockerReadinessProbeOptions). */
export interface DockerReadinessProbeOptions {
  timeoutMs?: number;
  source?: DockerRuntimeStatus["source"];
}

/** Contrato tipado público (DockerWaitOptions). */
export interface DockerWaitOptions {
  maxWaitMs: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  source?: DockerRuntimeStatus["source"];
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildStatus(
  state: DockerRuntimeStatus["state"],
  detail: string,
  source: DockerRuntimeStatus["source"],
  retries = 0,
): DockerRuntimeStatus {
  return {
    state,
    detail,
    source,
    retries,
    lastCheckedAt: nowIso(),
  };
}

function isCommandMissing(result: CommandResult): boolean {
  const joined =
    `${result.message} ${result.stderr} ${result.stdout}`.toLowerCase();
  return (
    joined.includes("enoent") ||
    joined.includes("not recognized") ||
    joined.includes("command not found")
  );
}

function isDaemonUnavailable(result: CommandResult): boolean {
  const joined =
    `${result.message} ${result.stderr} ${result.stdout}`.toLowerCase();
  return (
    joined.includes("cannot connect to the docker daemon") ||
    joined.includes("error during connect") ||
    joined.includes("docker daemon is not running") ||
    joined.includes("timed out") ||
    joined.includes("context deadline exceeded")
  );
}

/** Servicio del proceso principal: DockerReadinessService. */
export class DockerReadinessService {
  /**
   * Construye la instancia del servicio.
   * @param {ProcessRunnerService} processRunner - Entrada esperada por la función.
   */
  constructor(private readonly processRunner = new ProcessRunnerService()) {}

  /**
   * Comprueba disponibilidad o conectividad del componente.
   * @param {DockerReadinessProbeOptions} options - Entrada esperada por la función.
   * @returns {Promise<DockerRuntimeStatus>} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  async probe(
    options: DockerReadinessProbeOptions = {},
  ): Promise<DockerRuntimeStatus> {
    const timeoutMs = options.timeoutMs ?? 12_000;
    const source = options.source ?? "boot-guardian";

    const dockerBinary = await this.processRunner.run({
      command: "docker",
      args: ["--version"],
      timeoutMs,
    });

    if (!dockerBinary.ok) {
      if (isCommandMissing(dockerBinary)) {
        return buildStatus(
          "not-installed",
          "Docker CLI no está instalado o no está en PATH.",
          source,
        );
      }

      // Si no podemos ni validar CLI, tratamos el estado como error de runtime.
      return buildStatus(
        "daemon-error",
        dockerBinary.stderr || dockerBinary.message,
        source,
      );
    }

    const daemonInfo = await this.processRunner.run({
      command: "docker",
      args: ["info", "--format", "{{.ServerVersion}}"],
      timeoutMs,
    });

    if (!daemonInfo.ok) {
      if (process.platform === "win32") {
        const desktopRunning =
          await this.isDockerDesktopProcessRunning(timeoutMs);
        if (!desktopRunning.running) {
          return buildStatus(
            "desktop-not-running",
            desktopRunning.detail,
            source,
          );
        }
      }

      if (isDaemonUnavailable(daemonInfo)) {
        return buildStatus(
          "daemon-starting",
          daemonInfo.stderr || daemonInfo.message,
          source,
        );
      }

      return buildStatus(
        "daemon-error",
        daemonInfo.stderr || daemonInfo.message,
        source,
      );
    }

    const daemonPs = await this.processRunner.run({
      command: "docker",
      args: ["ps", "--format", "{{.ID}}"],
      timeoutMs,
    });

    if (!daemonPs.ok) {
      return buildStatus(
        "daemon-error",
        daemonPs.stderr || daemonPs.message,
        source,
      );
    }

    return buildStatus(
      "daemon-ready",
      daemonInfo.stdout || "Docker daemon operativo.",
      source,
    );
  }

  /**
   * Inicia el flujo o proceso solicitado.
   * @param {DockerRuntimeStatus} source - Entrada esperada por la función.
   * @returns {Promise<DockerRuntimeStatus>} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  async startDockerDesktop(
    source: DockerRuntimeStatus["source"] = "boot-guardian",
  ): Promise<DockerRuntimeStatus> {
    if (process.platform === "win32") {
      return this.startDockerDesktopWindows(source);
    }

    if (process.platform === "darwin") {
      const openResult = await this.processRunner.run({
        command: "open",
        args: ["-a", "Docker"],
        timeoutMs: 15_000,
      });

      return openResult.ok
        ? buildStatus(
            "daemon-starting",
            "Docker Desktop iniciado (macOS).",
            source,
          )
        : buildStatus(
            "daemon-error",
            openResult.stderr || openResult.message,
            source,
          );
    }

    const serviceResult = await this.processRunner.run({
      command: "systemctl",
      args: ["start", "docker"],
      timeoutMs: 20_000,
    });

    return serviceResult.ok
      ? buildStatus(
          "daemon-starting",
          "Servicio Docker iniciado (Linux).",
          source,
        )
      : buildStatus(
          "daemon-error",
          serviceResult.stderr || serviceResult.message,
          source,
        );
  }

  /**
   * Espera hasta que se cumplan las condiciones indicadas.
   * @param {DockerWaitOptions} options - Entrada esperada por la función.
   * @returns {Promise<DockerRuntimeStatus>} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  async waitUntilReady(
    options: DockerWaitOptions,
  ): Promise<DockerRuntimeStatus> {
    const source = options.source ?? "boot-guardian";
    const startTime = Date.now();
    const maxWaitMs = Math.max(5_000, options.maxWaitMs);
    const initialDelayMs = options.initialDelayMs ?? 2_000;
    const maxDelayMs = options.maxDelayMs ?? 12_000;

    let retries = 0;
    let delayMs = Math.max(500, initialDelayMs);
    let lastStatus = await this.probe({ source, timeoutMs: 12_000 });

    while (Date.now() - startTime < maxWaitMs) {
      if (lastStatus.state === "daemon-ready") {
        return { ...lastStatus, retries };
      }

      const jitter = Math.floor(Math.random() * 500);
      await this.delay(delayMs + jitter);
      retries += 1;
      delayMs = Math.min(maxDelayMs, Math.floor(delayMs * 1.5));
      lastStatus = await this.probe({ source, timeoutMs: 12_000 });
    }

    return {
      ...lastStatus,
      retries,
      state:
        lastStatus.state === "daemon-ready"
          ? "daemon-ready"
          : lastStatus.state === "not-installed"
            ? "not-installed"
            : "daemon-error",
      detail:
        lastStatus.state === "daemon-ready"
          ? lastStatus.detail
          : `Docker no quedó operativo dentro de ${Math.round(maxWaitMs / 1000)}s. ${lastStatus.detail}`,
      lastCheckedAt: nowIso(),
    };
  }

  private async isDockerDesktopProcessRunning(
    timeoutMs: number,
  ): Promise<{ running: boolean; detail: string }> {
    const command = [
      "$procs = Get-Process -Name 'Docker Desktop','com.docker.backend' -ErrorAction SilentlyContinue",
      "if ($null -eq $procs) { Write-Output 'NOT_RUNNING'; exit 0 }",
      "Write-Output 'RUNNING'",
    ].join("; ");

    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-Command", command],
      timeoutMs,
    });

    if (!result.ok) {
      return {
        running: false,
        detail: result.stderr || result.message,
      };
    }

    return result.stdout.includes("RUNNING")
      ? { running: true, detail: "Docker Desktop en ejecución." }
      : { running: false, detail: "Docker Desktop no está iniciado." };
  }

  private async startDockerDesktopWindows(
    source: DockerRuntimeStatus["source"],
  ): Promise<DockerRuntimeStatus> {
    const resolved = await resolveWindowsDockerDesktopExePath(
      this.processRunner,
    );
    const candidatePaths =
      resolved !== null
        ? [resolved]
        : [
            "C:/Program Files/Docker/Docker/Docker Desktop.exe",
            "C:/Program Files/Docker/Docker/Docker Desktop",
          ];

    for (const executablePath of candidatePaths) {
      const escaped = executablePath.replace(/'/g, "''");
      const result = await this.processRunner.run({
        command: "powershell",
        args: [
          "-NoProfile",
          "-Command",
          `if (Test-Path -LiteralPath '${escaped}') { Start-Process -FilePath '${escaped}'; exit 0 } else { exit 1 }`,
        ],
        timeoutMs: 12_000,
      });

      if (result.ok) {
        return buildStatus(
          "daemon-starting",
          `Docker Desktop iniciado desde ${executablePath}.`,
          source,
        );
      }
    }

    return buildStatus(
      "daemon-error",
      "No se encontró Docker Desktop.exe (Program Files, perfil local ni registro de desinstalación).",
      source,
    );
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
