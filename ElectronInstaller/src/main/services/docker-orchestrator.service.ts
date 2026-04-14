import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import type {
  OperationResult,
  RuntimeLogEvent,
  ServiceHealth,
  TailLogsPayload,
} from "@shared/contracts";

import {
  assertAllowedService,
  assertRuntimePath,
} from "@main/security/command-allowlist";

import { PathResolverService } from "./path-resolver.service";
import { ProcessRunnerService } from "./process-runner.service";

interface ComposePsEntry {
  Service?: string;
  Name?: string;
  State?: string;
  Health?: string;
  Status?: string;
}

function parseComposeEntries(rawOutput: string): ComposePsEntry[] {
  const trimmed = rawOutput.trim();
  if (trimmed.length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed) as ComposePsEntry | ComposePsEntry[];
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .flatMap((line) => {
        try {
          return [JSON.parse(line) as ComposePsEntry];
        } catch {
          return [];
        }
      });
  }
}

function resolveServiceStatus(entry: ComposePsEntry): ServiceHealth["status"] {
  const stateRaw = `${entry.State ?? entry.Status ?? ""}`.trim().toLowerCase();
  const healthRaw = `${entry.Health ?? ""}`.trim().toLowerCase();

  if (healthRaw.includes("unhealthy")) {
    return "unhealthy";
  }

  if (healthRaw.includes("healthy")) {
    return "healthy";
  }

  if (healthRaw.includes("starting")) {
    return "starting";
  }

  if (
    stateRaw.includes("exited") ||
    stateRaw.includes("dead") ||
    stateRaw.includes("failed")
  ) {
    return "unhealthy";
  }

  if (
    stateRaw.includes("starting") ||
    stateRaw.includes("restarting") ||
    stateRaw.includes("created")
  ) {
    return "starting";
  }

  if (stateRaw.includes("running")) {
    return "running";
  }

  return "unknown";
}

function describeServiceDetail(
  status: ServiceHealth["status"],
  entry: ComposePsEntry,
): string {
  const stateRaw = `${entry.State ?? entry.Status ?? "sin dato"}`.trim();
  const healthRaw = `${entry.Health ?? "sin healthcheck"}`.trim();

  if (status === "healthy") {
    return `Servicio operativo y respondiendo al healthcheck. Docker reporta ${stateRaw} / ${healthRaw}.`;
  }

  if (status === "running") {
    return `Servicio en ejecución. Docker reporta ${stateRaw} y no exige healthcheck adicional.`;
  }

  if (status === "starting") {
    return `Servicio levantado, pendiente de completar la verificación. Docker reporta ${stateRaw} / ${healthRaw}.`;
  }

  if (status === "unhealthy") {
    return `Servicio con incidencia o healthcheck fallido. Docker reporta ${stateRaw} / ${healthRaw}.`;
  }

  return "Estado aún no disponible. Ejecuta una nueva verificación de salud.";
}

export function parseComposeHealthOutput(rawOutput: string): ServiceHealth[] {
  const entries = parseComposeEntries(rawOutput);
  const mappedByService = new Map<ServiceHealth["service"], ServiceHealth>();

  for (const entry of entries) {
    const serviceName = entry.Service ?? entry.Name ?? "db";
    const status = resolveServiceStatus(entry);

    mappedByService.set(normalizeService(serviceName), {
      service: normalizeService(serviceName),
      status,
      detail: describeServiceDetail(status, entry),
    });
  }

  return [...mappedByService.values()];
}

function normalizeService(value: string): ServiceHealth["service"] {
  if (value.includes("frontend")) {
    return "frontend";
  }
  if (value.includes("backend")) {
    return "backend";
  }
  if (value.includes("redis")) {
    return "redis";
  }
  return "db";
}

export class DockerOrchestratorService {
  private logProcess: ReturnType<typeof spawn> | null = null;

  constructor(
    private readonly pathResolver = new PathResolverService(),
    private readonly processRunner = new ProcessRunnerService(),
  ) {}

  async startStack(
    runtimePath: string,
    onLogLine?: (event: RuntimeLogEvent) => void,
  ): Promise<OperationResult> {
    const result = await this.runCompose(
      runtimePath,
      ["up", "-d", "--build", "--remove-orphans"],
      300_000,
      onLogLine,
    );
    return this.commandResult(result, "Stack iniciado", "DOCKER_START_FAILED");
  }

  async stopStack(runtimePath: string): Promise<OperationResult> {
    const result = await this.runCompose(runtimePath, ["down"], 120_000);
    return this.commandResult(result, "Stack detenido", "DOCKER_STOP_FAILED");
  }

  async restartStack(runtimePath: string): Promise<OperationResult> {
    const result = await this.runCompose(runtimePath, ["restart"], 120_000);
    return this.commandResult(
      result,
      "Stack reiniciado",
      "DOCKER_RESTART_FAILED",
    );
  }

  async getHealth(
    runtimePath: string,
  ): Promise<OperationResult<ServiceHealth[]>> {
    const result = await this.runCompose(
      runtimePath,
      ["ps", "--format", "json"],
      30_000,
    );

    if (!result.ok) {
      return {
        ok: false,
        message: "No se pudo obtener estado de servicios",
        errorCode: "DOCKER_HEALTH_FAILED",
      };
    }

    return {
      ok: true,
      message: "Estado de servicios obtenido",
      data: parseComposeHealthOutput(result.stdout),
    };
  }

  async tailLogs(
    payload: TailLogsPayload,
    onLogLine: (event: RuntimeLogEvent) => void,
  ): Promise<OperationResult> {
    const runtimePath = assertRuntimePath(payload.runtimePath);
    assertAllowedService(payload.service);

    this.stopLogStream();

    const composeArgs = [
      ...this.getComposeBaseArgs(runtimePath),
      "logs",
      payload.service,
      "--tail",
      String(payload.lines),
      "--follow",
    ];

    const logProcess = spawn("docker", composeArgs, {
      cwd: this.pathResolver.getProjectRoot(),
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    this.logProcess = logProcess;

    logProcess.stdout.on("data", (chunk: Buffer) => {
      chunk
        .toString("utf8")
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .forEach((line) => {
          onLogLine({
            service: payload.service,
            line,
            timestamp: new Date().toISOString(),
          });
        });
    });

    logProcess.stderr.on("data", (chunk: Buffer) => {
      chunk
        .toString("utf8")
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .forEach((line) => {
          onLogLine({
            service: payload.service,
            line,
            timestamp: new Date().toISOString(),
          });
        });
    });

    return {
      ok: true,
      message: `Streaming de logs iniciado para ${payload.service}`,
    };
  }

  stopLogStream(): OperationResult {
    if (this.logProcess) {
      this.logProcess.kill("SIGTERM");
      this.logProcess = null;
    }

    return {
      ok: true,
      message: "Streaming de logs detenido",
    };
  }

  async pruneSafe(
    runtimePath: string,
    level: "safe" | "aggressive",
  ): Promise<OperationResult> {
    const safeResult = await this.processRunner.run({
      command: "docker",
      args: ["image", "prune", "-f"],
      timeoutMs: 60_000,
      cwd: this.pathResolver.getProjectRoot(),
    });

    if (!safeResult.ok) {
      return {
        ok: false,
        message: "No se pudo ejecutar limpieza segura.",
        errorCode: "DOCKER_PRUNE_FAILED",
      };
    }

    if (level === "aggressive") {
      const aggressiveResult = await this.processRunner.run({
        command: "docker",
        args: ["system", "prune", "-f", "--volumes"],
        timeoutMs: 120_000,
        cwd: this.pathResolver.getProjectRoot(),
      });

      return this.commandResult(
        aggressiveResult,
        "Limpieza agresiva completada",
        "DOCKER_PRUNE_FAILED",
      );
    }

    await this.prepareRuntimeDirectories(assertRuntimePath(runtimePath));

    return {
      ok: true,
      message: "Limpieza segura completada.",
    };
  }

  private async runCompose(
    runtimePath: string,
    actionArgs: string[],
    timeoutMs: number,
    onLogLine?: (event: RuntimeLogEvent) => void,
  ) {
    const safeRuntimePath = assertRuntimePath(runtimePath);
    await this.prepareRuntimeDirectories(safeRuntimePath);

    return this.processRunner.run({
      command: "docker",
      args: [...this.getComposeBaseArgs(safeRuntimePath), ...actionArgs],
      timeoutMs,
      cwd: this.pathResolver.getProjectRoot(),
      onStdoutLine: onLogLine
        ? (line: string) => {
            onLogLine({
              service: "docker",
              line,
              timestamp: new Date().toISOString(),
            });
          }
        : undefined,
      onStderrLine: onLogLine
        ? (line: string) => {
            onLogLine({
              service: "docker",
              line,
              timestamp: new Date().toISOString(),
            });
          }
        : undefined,
    });
  }

  private getComposeBaseArgs(runtimePath: string): string[] {
    const composeFile = path.join(
      this.pathResolver.getProjectRoot(),
      "docker-compose.prod.yml",
    );
    const envFile = path.join(runtimePath, ".env.prod");
    return ["compose", "-f", composeFile, "--env-file", envFile];
  }

  private async prepareRuntimeDirectories(runtimePath: string): Promise<void> {
    await Promise.all([
      fs.mkdir(runtimePath, { recursive: true }),
      fs.mkdir(path.join(runtimePath, "certs"), { recursive: true }),
      fs.mkdir(
        path.join(
          runtimePath,
          "certs-webroot",
          ".well-known",
          "acme-challenge",
        ),
        {
          recursive: true,
        },
      ),
      fs.mkdir(path.join(runtimePath, "backups"), { recursive: true }),
      fs.mkdir(path.join(runtimePath, "diagnostics"), { recursive: true }),
    ]);
  }

  private commandResult(
    commandResult: { ok: boolean; stderr: string },
    successMessage: string,
    failureCode: string,
  ): OperationResult {
    if (!commandResult.ok) {
      return {
        ok: false,
        message: commandResult.stderr || "Operación Docker fallida",
        errorCode: failureCode,
      };
    }

    return {
      ok: true,
      message: successMessage,
    };
  }
}
