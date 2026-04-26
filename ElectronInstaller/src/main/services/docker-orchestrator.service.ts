import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import fsSync from "node:fs";
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
import {
  resolveWindowsDockerCliPath,
  resolveWindowsDockerDesktopExePath,
} from "./docker-desktop-windows-resolve";

interface ComposeLocation {
  composeFile: string;
  projectDirectory: string;
}

interface ComposePsEntry {
  Service?: string;
  Name?: string;
  State?: string;
  Health?: string;
  Status?: string;
}

interface DockerOrchestratorOptions {
  dockerStartupWaitMs?: number;
  dockerStartupPollMs?: number;
}

const ANSI_ESCAPE_REGEX =
  // eslint-disable-next-line no-control-regex
  /\u001b(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;

function stripAnsi(input: string): string {
  return input.replace(ANSI_ESCAPE_REGEX, "");
}

export function isDockerDesktopLinuxPipeError(rawOutput: string): boolean {
  const normalized = rawOutput.toLowerCase();
  return (
    normalized.includes("dockerdesktoplinuxengine") &&
    normalized.includes("pipe")
  );
}

export function parseDockerContextNames(rawOutput: string): string[] {
  return rawOutput
    .split(/\r?\n/)
    .map((line) => line.replace("*", "").trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split(/\s+/)[0] ?? "")
    .filter(
      (name, index, list) => name.length > 0 && list.indexOf(name) === index,
    );
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
  private dockerCommand: string | null = null;
  private dockerContext: string | null = null;
  private readonly envFileName = ".env.prod";
  private readonly startStackTimeoutMs = 3_600_000; // 1 hora en lugar de 20 min, permite build lento en cliente
  private readonly letsEncryptRenewTaskName =
    "SmartEconomat-LetsEncrypt-Renewal";
  private readonly dockerStartupWaitMs: number;
  private readonly dockerStartupPollMs: number;

  constructor(
    private readonly pathResolver = new PathResolverService(),
    private readonly processRunner = new ProcessRunnerService(),
    options: DockerOrchestratorOptions = {},
  ) {
    this.dockerStartupWaitMs = options.dockerStartupWaitMs ?? 120_000;
    this.dockerStartupPollMs = options.dockerStartupPollMs ?? 3_000;
  }

  async startStack(
    runtimePath: string,
    onLogLine?: (event: RuntimeLogEvent) => void,
  ): Promise<OperationResult> {
    const envCheck = await this.ensureRuntimeEnvFile(runtimePath);
    if (!envCheck.ok) {
      return envCheck;
    }

    const downResult = await this.runCompose(
      runtimePath,
      ["down", "--remove-orphans"],
      180_000,
      onLogLine,
    );

    if (!downResult.ok && onLogLine) {
      onLogLine({
        service: "docker",
        line: "No se pudo hacer down previo del stack; se intentará continuar con recreate forzado.",
        timestamp: new Date().toISOString(),
      });
    }

    const result = await this.runCompose(
      runtimePath,
      ["up", "-d", "--build", "--force-recreate", "--remove-orphans"],
      this.startStackTimeoutMs,
      onLogLine,
    );
    return this.commandResult(result, "Stack iniciado", "DOCKER_START_FAILED");
  }

        /**
     * Documentación en español.
     */
  async softStartStack(
    runtimePath: string,
    onLogLine?: (event: RuntimeLogEvent) => void,
  ): Promise<OperationResult> {
    const envCheck = await this.ensureRuntimeEnvFile(runtimePath);
    if (!envCheck.ok) {
      return envCheck;
    }

    const result = await this.runCompose(
      runtimePath,
      ["up", "-d", "--remove-orphans"],
      300_000,
      onLogLine,
    );
    return this.commandResult(
      result,
      "Stack iniciado (soft)",
      "DOCKER_SOFT_START_FAILED",
    );
  }

  async stopStack(runtimePath: string): Promise<OperationResult> {
    const result = await this.runCompose(runtimePath, ["down"], 120_000);
    return this.commandResult(result, "Stack detenido", "DOCKER_STOP_FAILED");
  }

  async restartStack(runtimePath: string): Promise<OperationResult> {
    const envCheck = await this.ensureRuntimeEnvFile(runtimePath);
    if (!envCheck.ok) {
      return envCheck;
    }

    const result = await this.runCompose(runtimePath, ["restart"], 120_000);
    return this.commandResult(
      result,
      "Stack reiniciado",
      "DOCKER_RESTART_FAILED",
    );
  }

  async restartService(
    runtimePath: string,
    service: ServiceHealth["service"],
  ): Promise<OperationResult> {
    assertAllowedService(service);

    const result = await this.runCompose(
      runtimePath,
      ["restart", service],
      120_000,
    );

    return this.commandResult(
      result,
      `Servicio ${service} reiniciado`,
      "DOCKER_RESTART_FAILED",
    );
  }

  async provisionLetsEncrypt(
    runtimePath: string,
    host: string,
    onLogLine?: (event: RuntimeLogEvent) => void,
  ): Promise<OperationResult> {
    const envCheck = await this.ensureRuntimeEnvFile(runtimePath);
    if (!envCheck.ok) {
      return envCheck;
    }

    const domain = host.trim().toLowerCase();
    if (!domain) {
      return {
        ok: false,
        message:
          "Dominio vacío para Let's Encrypt. Configura un host válido antes de continuar.",
        errorCode: "LETSENCRYPT_DOMAIN_REQUIRED",
      };
    }

    const safeRuntimePath = assertRuntimePath(runtimePath);
    const certsDir = path.join(safeRuntimePath, "certs");
    const certsWebrootDir = path.join(safeRuntimePath, "certs-webroot");

    await this.prepareRuntimeDirectories(safeRuntimePath);

    const certbotResult = await this.processRunner.run({
      command: await this.getDockerCommand(),
      args: [
        ...this.getDockerGlobalArgs(),
        "run",
        "--rm",
        "-v",
        `${certsDir}:/etc/letsencrypt`,
        "-v",
        `${certsWebrootDir}:/var/www/acme-challenge`,
        "certbot/certbot:latest",
        "certonly",
        "--webroot",
        "-w",
        "/var/www/acme-challenge",
        "-d",
        domain,
        "--agree-tos",
        "--non-interactive",
        "--register-unsafely-without-email",
        "--keep-until-expiring",
        "--preferred-challenges",
        "http",
      ],
      timeoutMs: 300_000,
      cwd: this.pathResolver.getProjectRoot(),
      env: this.getDockerEnvironment(),
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

    if (!certbotResult.ok) {
      return {
        ok: false,
        message:
          certbotResult.stderr ||
          "No se pudo emitir/renovar el certificado Let's Encrypt.",
        errorCode: "LETSENCRYPT_PROVISION_FAILED",
      };
    }

    const liveDir = path.join(certsDir, "live", domain);
    const sourceFullchainPath = path.join(liveDir, "fullchain.pem");
    const sourcePrivkeyPath = path.join(liveDir, "privkey.pem");
    const stableFullchainPath = path.join(certsDir, "fullchain.pem");
    const stablePrivkeyPath = path.join(certsDir, "privkey.pem");

    try {
      await fs.access(sourceFullchainPath);
      await fs.access(sourcePrivkeyPath);
      await fs.copyFile(sourceFullchainPath, stableFullchainPath);
      await fs.copyFile(sourcePrivkeyPath, stablePrivkeyPath);
    } catch {
      return {
        ok: false,
        message:
          "Let's Encrypt no generó fullchain.pem/privkey.pem en runtime/certs/live/<dominio>.",
        errorCode: "LETSENCRYPT_CERTS_NOT_FOUND",
      };
    }

    const restartResult = await this.runCompose(
      safeRuntimePath,
      ["restart", "frontend"],
      120_000,
      onLogLine,
    );

    if (!restartResult.ok) {
      return {
        ok: false,
        message:
          restartResult.stderr ||
          "Certificado emitido, pero no se pudo reiniciar frontend para aplicar TLS.",
        errorCode: "LETSENCRYPT_FRONTEND_RESTART_FAILED",
      };
    }

    return {
      ok: true,
      message:
        "Certificado Let's Encrypt emitido/actualizado correctamente y aplicado en frontend.",
    };
  }

  async configureLetsEncryptRenewal(
    runtimePath: string,
    host: string,
  ): Promise<OperationResult> {
    const domain = host.trim().toLowerCase();
    if (!domain) {
      return {
        ok: false,
        message:
          "No se puede configurar renovación automática sin dominio válido.",
        errorCode: "LETSENCRYPT_DOMAIN_REQUIRED",
      };
    }

    if (process.platform !== "win32") {
      return {
        ok: true,
        message:
          "Renovación automática en Windows no requerida para esta plataforma. Configura cron/systemd en el host si aplica.",
      };
    }

    const safeRuntimePath = assertRuntimePath(runtimePath);
    const renewalScriptDir = path.join(safeRuntimePath, "scripts");
    const renewalScriptPath = path.join(
      renewalScriptDir,
      "renew-letsencrypt.ps1",
    );

    await fs.mkdir(renewalScriptDir, { recursive: true });

    const renewalScript = [
      "param(",
      "  [Parameter(Mandatory = $true)][string]$RuntimePath,",
      "  [Parameter(Mandatory = $true)][string]$Domain",
      ")",
      "$ErrorActionPreference = 'Stop'",
      "$certsDir = Join-Path $RuntimePath 'certs'",
      "$webrootDir = Join-Path $RuntimePath 'certs-webroot'",
      "$liveDir = Join-Path (Join-Path $certsDir 'live') $Domain",
      "$sourceFullchain = Join-Path $liveDir 'fullchain.pem'",
      "$sourcePrivkey = Join-Path $liveDir 'privkey.pem'",
      "$targetFullchain = Join-Path $certsDir 'fullchain.pem'",
      "$targetPrivkey = Join-Path $certsDir 'privkey.pem'",
      "New-Item -ItemType Directory -Path $certsDir -Force | Out-Null",
      "New-Item -ItemType Directory -Path $webrootDir -Force | Out-Null",
      'docker run --rm -v "$certsDir:/etc/letsencrypt" -v "$webrootDir:/var/www/acme-challenge" certbot/certbot:latest certonly --webroot -w /var/www/acme-challenge -d $Domain --agree-tos --non-interactive --register-unsafely-without-email --keep-until-expiring --preferred-challenges http | Out-Null',
      "if ((Test-Path -LiteralPath $sourceFullchain) -and (Test-Path -LiteralPath $sourcePrivkey)) {",
      "  Copy-Item -Path $sourceFullchain -Destination $targetFullchain -Force",
      "  Copy-Item -Path $sourcePrivkey -Destination $targetPrivkey -Force",
      "}",
      '$frontendId = (docker ps -q --filter "label=com.docker.compose.project=smarteconomat-prod" --filter "label=com.docker.compose.service=frontend" | Select-Object -First 1)',
      "if (-not [string]::IsNullOrWhiteSpace($frontendId)) { docker restart $frontendId | Out-Null }",
    ].join("\r\n");

    await fs.writeFile(renewalScriptPath, renewalScript, {
      encoding: "utf8",
      mode: 0o600,
    });

    const taskCommand = `powershell -NoProfile -ExecutionPolicy Bypass -File "${renewalScriptPath}" -RuntimePath "${safeRuntimePath}" -Domain "${domain}"`;
    const taskResult = await this.processRunner.run({
      command: "schtasks",
      args: [
        "/Create",
        "/F",
        "/SC",
        "DAILY",
        "/ST",
        "03:15",
        "/RU",
        "SYSTEM",
        "/TN",
        this.letsEncryptRenewTaskName,
        "/TR",
        taskCommand,
      ],
      timeoutMs: 20_000,
    });

    if (!taskResult.ok) {
      return {
        ok: false,
        message:
          taskResult.stderr ||
          "No se pudo registrar la tarea de renovación automática de Let's Encrypt.",
        errorCode: "LETSENCRYPT_RENEWAL_SETUP_FAILED",
      };
    }

    const firstRunResult = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        renewalScriptPath,
        "-RuntimePath",
        safeRuntimePath,
        "-Domain",
        domain,
      ],
      timeoutMs: 300_000,
      cwd: this.pathResolver.getProjectRoot(),
    });

    if (!firstRunResult.ok) {
      return {
        ok: false,
        message:
          firstRunResult.stderr ||
          "No se pudo ejecutar la primera renovación automática de Let's Encrypt.",
        errorCode: "LETSENCRYPT_RENEWAL_SETUP_FAILED",
      };
    }

    return {
      ok: true,
      message:
        "Renovación automática de Let's Encrypt configurada (tarea diaria a las 03:15).",
    };
  }

  async getHealth(
    runtimePath: string,
  ): Promise<OperationResult<ServiceHealth[]>> {
    const envCheck = await this.ensureRuntimeEnvFile(runtimePath);
    if (!envCheck.ok) {
      return {
        ok: false,
        message: envCheck.message,
        errorCode: envCheck.errorCode,
      };
    }

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

  async getServiceLogs(
    runtimePath: string,
    service: ServiceHealth["service"],
    lines = 200,
  ): Promise<OperationResult<string>> {
    assertAllowedService(service);

    const result = await this.runCompose(
      runtimePath,
      ["logs", service, "--tail", String(lines)],
      30_000,
    );

    if (!result.ok) {
      return {
        ok: false,
        message: result.stderr || `No se pudieron obtener logs de ${service}.`,
        errorCode: "DOCKER_LOGS_FAILED",
      };
    }

    const mergedLogs = [result.stdout, result.stderr]
      .filter((part) => part.trim().length > 0)
      .join("\n")
      .trim();

    return {
      ok: true,
      message: `Logs de ${service} obtenidos correctamente.`,
      data: stripAnsi(mergedLogs),
    };
  }

  async repairPostgresCredentials(
    runtimePath: string,
    onLogLine?: (event: RuntimeLogEvent) => void,
  ): Promise<OperationResult> {
    const envCheck = await this.ensureRuntimeEnvFile(runtimePath);
    if (!envCheck.ok) {
      return envCheck;
    }

    const ensureDbRunning = await this.runCompose(
      runtimePath,
      ["up", "-d", "db"],
      120_000,
      onLogLine,
    );

    if (!ensureDbRunning.ok) {
      return this.commandResult(
        ensureDbRunning,
        "Contenedor db listo para reparación",
        "DOCKER_DB_REPAIR_FAILED",
      );
    }

    const alterPasswordCommand =
      'set -eu; psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "${POSTGRES_DB:-postgres}" -v newpass="$POSTGRES_PASSWORD" -c "ALTER USER "$POSTGRES_USER" WITH PASSWORD :\'newpass\';"';

    const repairResult = await this.runCompose(
      runtimePath,
      ["exec", "-T", "db", "sh", "-lc", alterPasswordCommand],
      60_000,
      onLogLine,
    );

    return this.commandResult(
      repairResult,
      "Credenciales de PostgreSQL alineadas correctamente.",
      "DOCKER_DB_REPAIR_FAILED",
    );
  }

  async repairApplicationAdminCredentials(
    runtimePath: string,
    adminUsername: string,
    adminPassword: string,
    adminEmail: string | undefined,
    superAdminUsername: string,
    superAdminPassword: string,
    superAdminEmail: string | undefined,
    onLogLine?: (event: RuntimeLogEvent) => void,
  ): Promise<OperationResult> {
    const envCheck = await this.ensureRuntimeEnvFile(runtimePath);
    if (!envCheck.ok) {
      return envCheck;
    }

    const ensureCoreServices = await this.runCompose(
      runtimePath,
      ["up", "-d", "db", "backend"],
      180_000,
      onLogLine,
    );

    if (!ensureCoreServices.ok) {
      return this.commandResult(
        ensureCoreServices,
        "Servicios db/backend listos para reparar credenciales administrativas",
        "DOCKER_ADMIN_REPAIR_FAILED",
      );
    }

    const adminHashResult = await this.generateBcryptHashInBackend(
      runtimePath,
      adminPassword,
      onLogLine,
    );
    if (!adminHashResult.ok || !adminHashResult.data) {
      return {
        ok: false,
        message:
          adminHashResult.message ||
          "No se pudo generar hash para contraseña de admin.",
        errorCode: "DOCKER_ADMIN_REPAIR_FAILED",
      };
    }

    const superAdminHashResult = await this.generateBcryptHashInBackend(
      runtimePath,
      superAdminPassword,
      onLogLine,
    );
    if (!superAdminHashResult.ok || !superAdminHashResult.data) {
      return {
        ok: false,
        message:
          superAdminHashResult.message ||
          "No se pudo generar hash para contraseña de superadmin.",
        errorCode: "DOCKER_ADMIN_REPAIR_FAILED",
      };
    }

    const repairSql = this.buildAdminCredentialsRepairSql({
      adminUsername,
      adminHash: adminHashResult.data,
      adminEmail,
      superAdminUsername,
      superAdminHash: superAdminHashResult.data,
      superAdminEmail,
    });

    const repairResult = await this.runCompose(
      runtimePath,
      [
        "exec",
        "-T",
        "db",
        "psql",
        "-v",
        "ON_ERROR_STOP=1",
        "-U",
        "postgres",
        "-d",
        "smarteconomat",
        "-c",
        repairSql,
      ],
      90_000,
      onLogLine,
    );

    return this.commandResult(
      repairResult,
      "Credenciales administrativas reparadas correctamente.",
      "DOCKER_ADMIN_REPAIR_FAILED",
    );
  }

  async tailLogs(
    payload: TailLogsPayload,
    onLogLine: (event: RuntimeLogEvent) => void,
  ): Promise<OperationResult> {
    const runtimePath = assertRuntimePath(payload.runtimePath);
    assertAllowedService(payload.service);

    this.stopLogStream();

    const composeArgs = [
      ...this.getDockerGlobalArgs(),
      ...this.getComposeBaseArgs(runtimePath),
      "logs",
      payload.service,
      "--tail",
      String(payload.lines),
      "--follow",
    ];

    const logProcess = spawn(await this.getDockerCommand(), composeArgs, {
      cwd: this.pathResolver.getProjectRoot(),
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    this.logProcess = logProcess;

    logProcess.stdout.on("data", (chunk: Buffer) => {
      chunk
        .toString("utf8")
        .split("\n")
        .map((line) => stripAnsi(line))
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
        .map((line) => stripAnsi(line))
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
      command: await this.getDockerCommand(),
      args: [...this.getDockerGlobalArgs(), "image", "prune", "-f"],
      timeoutMs: 60_000,
      cwd: this.pathResolver.getProjectRoot(),
      env: this.getDockerEnvironment(),
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
        command: await this.getDockerCommand(),
        args: [
          ...this.getDockerGlobalArgs(),
          "system",
          "prune",
          "-f",
          "--volumes",
        ],
        timeoutMs: 120_000,
        cwd: this.pathResolver.getProjectRoot(),
        env: this.getDockerEnvironment(),
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
    const envFilePath = this.getEnvFilePath(safeRuntimePath);
    const readinessCheck = await this.ensureDockerContextAndDaemon(onLogLine);
    if (!readinessCheck.ok) {
      return {
        ok: false,
        code: 1,
        stdout: "",
        stderr: readinessCheck.message,
        message: readinessCheck.message,
      };
    }

    return this.processRunner.run({
      command: await this.getDockerCommand(),
      args: [
        ...this.getDockerGlobalArgs(),
        ...this.getComposeBaseArgs(safeRuntimePath),
        ...actionArgs,
      ],
      timeoutMs,
      cwd: this.pathResolver.getProjectRoot(),
      env: this.getDockerEnvironment({
        SMARTECONOMAT_ENV_FILE: envFilePath,
        ...(this.shouldRunStartupMigrations(actionArgs)
          ? { STARTUP_RUN_MIGRATIONS: "true" }
          : {}),
      }),
      onStdoutLine: onLogLine
        ? (line: string) => {
            const cleanLine = stripAnsi(line);
            onLogLine({
              service: "docker",
              line: cleanLine,
              timestamp: new Date().toISOString(),
            });
          }
        : undefined,
      onStderrLine: onLogLine
        ? (line: string) => {
            const cleanLine = stripAnsi(line);
            onLogLine({
              service: "docker",
              line: cleanLine,
              timestamp: new Date().toISOString(),
            });
          }
        : undefined,
    });
  }

  private async ensureDockerContextAndDaemon(
    onLogLine?: (event: RuntimeLogEvent) => void,
  ): Promise<OperationResult<string | null>> {
    const emit = (line: string): void => {
      if (!onLogLine) {
        return;
      }
      onLogLine({
        service: "docker",
        line,
        timestamp: new Date().toISOString(),
      });
    };

    const firstInfo = await this.processRunner.run({
      command: await this.getDockerCommand(),
      args: [
        ...this.getDockerGlobalArgs(),
        "info",
        "--format",
        "{{.ServerVersion}}",
      ],
      timeoutMs: 20_000,
      cwd: this.pathResolver.getProjectRoot(),
      env: this.getDockerEnvironment(),
    });
    if (firstInfo.ok) {
      if (process.platform === "win32") {
        await this.ensureWindowsDockerServiceConfigured(emit);
      }
      return {
        ok: true,
        message: "Docker daemon operativo.",
        data: this.dockerContext,
      };
    }

    const firstErrorText =
      `${firstInfo.stderr}\n${firstInfo.stdout}\n${firstInfo.message}`.trim();
    if (isDockerDesktopLinuxPipeError(firstErrorText)) {
      emit(
        "Detectado contexto Docker inválido (dockerDesktopLinuxEngine). Buscando contexto Docker operativo...",
      );
    }

    if (process.platform === "win32") {
      const serviceReady = await this.ensureWindowsDockerServiceRunning(emit);
      if (!serviceReady) {
        emit(
          "No se pudo dejar com.docker.service en Running; se continuará buscando un daemon Docker operativo.",
        );
      }
    }

    const detectedContext = await this.findWorkingDockerContext();
    if (detectedContext) {
      this.dockerContext = detectedContext;
      emit(`Usando contexto Docker operativo: ${detectedContext}`);
      return {
        ok: true,
        message: `Docker daemon operativo en contexto ${detectedContext}.`,
        data: detectedContext,
      };
    }

    if (process.platform === "win32") {
      const windowsState = await this.inspectWindowsDockerEngineState();
      if (windowsState.engineLikelyStuck) {
        emit(windowsState.detail);
        emit(
          "Estado recuperable: arrancando Docker Desktop y forzando engine Linux antes de fallar.",
        );
      }

      emit(
        "Docker daemon no responde. Iniciando Docker Desktop/Engine y esperando a que WSL exponga el daemon...",
      );
      await this.startWindowsDockerEngine();

      const contextAfterServiceStart =
        await this.waitForWorkingDockerContext(emit);
      if (contextAfterServiceStart) {
        this.dockerContext = contextAfterServiceStart;
        emit(
          `Docker daemon disponible tras reinicio de servicio en contexto ${contextAfterServiceStart}.`,
        );
        return {
          ok: true,
          message: "Docker daemon operativo tras reinicio de servicio.",
          data: contextAfterServiceStart,
        };
      }
    }

    return {
      ok: false,
      message:
        "Docker daemon no disponible tras reintentos de contexto/servicio. Revisa `docker context ls` y estado del daemon.",
      errorCode: "DOCKER_DAEMON_NOT_READY",
    };
  }

  private async startWindowsDockerEngine(): Promise<void> {
    await this.ensureWindowsDockerServiceRunning();

    const dockerDesktopPath = await resolveWindowsDockerDesktopExePath(
      this.processRunner,
    );

    if (!dockerDesktopPath) {
      return;
    }

    const escapedPath = dockerDesktopPath.replace(/'/g, "''");
    await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-Command",
        `Start-Process -FilePath '${escapedPath}' -WindowStyle Minimized -ErrorAction SilentlyContinue`,
      ],
      timeoutMs: 20_000,
      cwd: this.pathResolver.getProjectRoot(),
      env: this.getDockerEnvironment(),
    });

    await this.switchWindowsDockerToLinuxEngine();
  }

  private async switchWindowsDockerToLinuxEngine(): Promise<void> {
    const dockerCliCandidates = [
      "C:\\Program Files\\Docker\\Docker\\DockerCli.exe",
      "C:\\Program Files (x86)\\Docker\\Docker\\DockerCli.exe",
    ];

    for (const dockerCliPath of dockerCliCandidates) {
      const switchResult = await this.processRunner.run({
        command: "powershell",
        args: [
          "-NoProfile",
          "-Command",
          [
            `$dockerCli='${dockerCliPath.replace(/'/g, "''")}'`,
            "if (-not (Test-Path -LiteralPath $dockerCli)) { exit 2 }",
            "& $dockerCli -SwitchLinuxEngine",
            "exit 0",
          ].join("; "),
        ],
        timeoutMs: 45_000,
        cwd: this.pathResolver.getProjectRoot(),
        env: this.getDockerEnvironment(),
      });

      if (switchResult.ok || switchResult.code !== 2) {
        return;
      }
    }
  }

  private async ensureWindowsDockerServiceRunning(
    emit?: (line: string) => void,
  ): Promise<boolean> {
    const configureAndStart =
      await this.ensureWindowsDockerServiceConfigured(emit);
    if (configureAndStart) {
      return true;
    }

    const elevatedRepair =
      await this.tryElevatedWindowsDockerServiceRepair(emit);
    return elevatedRepair
      ? this.waitForWindowsDockerServiceRunning(emit)
      : false;
  }

  private async ensureWindowsDockerServiceConfigured(
    emit?: (line: string) => void,
  ): Promise<boolean> {
    const configureAndStart = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-Command",
        [
          "$service = Get-Service -Name 'com.docker.service' -ErrorAction SilentlyContinue",
          "if ($null -eq $service) { exit 2 }",
          "sc.exe config com.docker.service start= auto | Out-Null",
          "sc.exe failure com.docker.service reset= 86400 actions= restart/5000/restart/15000/restart/30000 | Out-Null",
          "Set-Service -Name 'com.docker.service' -StartupType Automatic -ErrorAction Stop",
          "$service = Get-Service -Name 'com.docker.service'",
          "if ($service.Status -ne 'Running') { Start-Service -Name 'com.docker.service' -ErrorAction Stop }",
          "$service = Get-Service -Name 'com.docker.service'",
          "if ($service.Status -eq 'Running') { exit 0 }",
          "exit 1",
        ].join("; "),
      ],
      timeoutMs: 20_000,
      cwd: this.pathResolver.getProjectRoot(),
      env: this.getDockerEnvironment(),
    });

    if (!configureAndStart.ok && configureAndStart.code === 2) {
      emit?.("Servicio com.docker.service no encontrado en Windows.");
      return false;
    }

    if (!configureAndStart.ok) {
      emit?.(
        "No se pudo configurar com.docker.service en modo normal; puede requerir elevación.",
      );
      return false;
    }

    return this.waitForWindowsDockerServiceRunning(emit);
  }

  private async waitForWindowsDockerServiceRunning(
    emit?: (line: string) => void,
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const status = await this.processRunner.run({
        command: "powershell",
        args: [
          "-NoProfile",
          "-Command",
          "(Get-Service -Name 'com.docker.service' -ErrorAction SilentlyContinue).Status",
        ],
        timeoutMs: 10_000,
        cwd: this.pathResolver.getProjectRoot(),
        env: this.getDockerEnvironment(),
      });

      if (status.ok && status.stdout.trim().toLowerCase() === "running") {
        return true;
      }

      emit?.(
        `Servicio com.docker.service aún no está Running (intento ${attempt}/5).`,
      );
      await this.delay(1_500);
    }

    return false;
  }

  private async tryElevatedWindowsDockerServiceRepair(
    emit?: (line: string) => void,
  ): Promise<boolean> {
    emit?.(
      "Windows requiere elevación para configurar com.docker.service. Solicitando UAC para dejarlo en Automatic/Running...",
    );
    const script = [
      "$ErrorActionPreference = 'Stop'",
      "sc.exe config com.docker.service start= auto | Out-Null",
      "sc.exe failure com.docker.service reset= 86400 actions= restart/5000/restart/15000/restart/30000 | Out-Null",
      "Set-Service -Name 'com.docker.service' -StartupType Automatic",
      "$service = Get-Service -Name 'com.docker.service'",
      "if ($service.Status -ne 'Running') { Start-Service -Name 'com.docker.service' }",
    ].join("; ");
    const encodedScript = Buffer.from(script, "utf16le").toString("base64");
    const elevateCommand = [
      `$argumentList = @('-NoProfile','-ExecutionPolicy','Bypass','-EncodedCommand','${encodedScript}')`,
      "$process = Start-Process -FilePath 'powershell.exe' -Verb RunAs -Wait -PassThru -ArgumentList $argumentList",
      "if ($null -eq $process) { exit 1 }",
      "exit $process.ExitCode",
    ].join("; ");

    const elevated = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        elevateCommand,
      ],
      timeoutMs: 90_000,
      cwd: this.pathResolver.getProjectRoot(),
      env: this.getDockerEnvironment(),
    });

    if (elevated.ok) {
      emit?.("Servicio com.docker.service configurado con elevación.");
      return true;
    }

    emit?.(
      "No se pudo configurar com.docker.service con elevación o el usuario canceló UAC.",
    );
    return false;
  }

  private async waitForWorkingDockerContext(
    emit: (line: string) => void,
  ): Promise<string | null> {
    const deadline = Date.now() + this.dockerStartupWaitMs;
    let attempt = 1;

    while (Date.now() <= deadline) {
      const context = await this.findWorkingDockerContext();
      if (context) {
        return context;
      }

      emit(
        `Docker daemon aún no disponible (intento ${attempt}). Esperando arranque de WSL/Engine...`,
      );
      attempt += 1;
      await this.delay(this.dockerStartupPollMs);
    }

    return null;
  }

  private async inspectWindowsDockerEngineState(): Promise<{
    engineLikelyStuck: boolean;
    detail: string;
  }> {
    const wslState = await this.processRunner.run({
      command: "wsl",
      args: ["-l", "-v"],
      timeoutMs: 20_000,
      cwd: this.pathResolver.getProjectRoot(),
      env: this.getDockerEnvironment(),
    });
    const pipes = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-Command",
        "Get-ChildItem -Path '\\\\.\\pipe\\' | Where-Object { $_.Name -like '*docker*' } | Select-Object -ExpandProperty Name",
      ],
      timeoutMs: 20_000,
      cwd: this.pathResolver.getProjectRoot(),
      env: this.getDockerEnvironment(),
    });

    const normalizedWsl = `${wslState.stdout}\n${wslState.stderr}`
      .split(String.fromCharCode(0))
      .join("")
      .toLowerCase();
    const normalizedPipes = `${pipes.stdout}\n${pipes.stderr}`.toLowerCase();
    const dockerDesktopStopped =
      normalizedWsl.includes("docker-desktop") &&
      normalizedWsl.includes("stopped");
    const hasEnginePipe =
      normalizedPipes.includes("docker_engine") ||
      normalizedPipes.includes("dockerdesktoplinuxengine");
    const hasDesktopBackendPipe = normalizedPipes.includes("dockerbackendv2");

    if (dockerDesktopStopped && !hasEnginePipe && hasDesktopBackendPipe) {
      return {
        engineLikelyStuck: true,
        detail:
          "Docker Desktop está abierto, pero el engine Linux de WSL no está arrancado: la distro `docker-desktop` está Stopped y no existen los pipes `docker_engine`/`dockerDesktopLinuxEngine`. Cierra Docker Desktop completamente o ejecuta reparación elevada del servicio antes de continuar.",
      };
    }

    return {
      engineLikelyStuck: false,
      detail: "Estado Docker Desktop no bloqueante.",
    };
  }

  private async findWorkingDockerContext(): Promise<string | null> {
    const contextList = await this.processRunner.run({
      command: await this.getDockerCommand(),
      args: ["context", "ls", "--format", "{{.Name}}"],
      timeoutMs: 20_000,
      cwd: this.pathResolver.getProjectRoot(),
      env: this.getDockerEnvironment(),
    });

    const contextNames = contextList.ok
      ? parseDockerContextNames(contextList.stdout)
      : [];
    const candidates = ["desktop-linux", "default", ...contextNames].filter(
      (name, index, list) => name.length > 0 && list.indexOf(name) === index,
    );

    for (const contextName of candidates) {
      const probe = await this.processRunner.run({
        command: await this.getDockerCommand(),
        args: [
          "--context",
          contextName,
          "info",
          "--format",
          "{{.ServerVersion}}",
        ],
        timeoutMs: 20_000,
        cwd: this.pathResolver.getProjectRoot(),
        env: this.getDockerEnvironment(),
      });

      if (probe.ok) {
        return contextName;
      }
    }

    return null;
  }

  private getDockerGlobalArgs(): string[] {
    return this.dockerContext ? ["--context", this.dockerContext] : [];
  }

  private async getDockerCommand(): Promise<string> {
    if (this.dockerCommand) {
      return this.dockerCommand;
    }

    this.dockerCommand =
      process.platform === "win32"
        ? ((await resolveWindowsDockerCliPath(this.processRunner)) ?? "docker")
        : "docker";
    return this.dockerCommand;
  }

  private getDockerEnvironment(
    extraEnv: NodeJS.ProcessEnv = {},
  ): NodeJS.ProcessEnv {
    const nextEnv = { ...process.env };
    delete nextEnv.DOCKER_CONTEXT;
    delete nextEnv.DOCKER_HOST;
    return {
      ...nextEnv,
      ...extraEnv,
    };
  }

  private shouldRunStartupMigrations(actionArgs: string[]): boolean {
    const [command, ...args] = actionArgs;
    if (command !== "up") {
      return false;
    }

    return args.includes("-d") || args.includes("--detach");
  }

  private async delay(ms: number): Promise<void> {
    if (ms <= 0) {
      return;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private getComposeBaseArgs(runtimePath: string): string[] {
    const composeLocation = this.resolveComposeLocation(runtimePath);
    const envFile = this.getEnvFilePath(runtimePath);
    return [
      "compose",
      "--project-directory",
      composeLocation.projectDirectory,
      "-f",
      composeLocation.composeFile,
      "--env-file",
      envFile,
    ];
  }

  private resolveComposeLocation(runtimePath: string): ComposeLocation {
    const candidates = [
      path.join(runtimePath, "project", "docker-compose.prod.yml"),
      path.join(this.pathResolver.getProjectRoot(), "docker-compose.prod.yml"),
      path.join(process.cwd(), "docker-compose.prod.yml"),
      path.join(process.cwd(), "ElectronInstaller", "docker-compose.prod.yml"),
    ];

    for (const candidate of candidates) {
      if (!fsSync.existsSync(candidate)) {
        continue;
      }

      const projectDirectory = path.dirname(candidate);
      if (!this.isValidComposeProjectRoot(projectDirectory)) {
        continue;
      }

      return { composeFile: candidate, projectDirectory };
    }

    const fallbackComposeFile = candidates[0] ?? "docker-compose.prod.yml";
    return {
      composeFile: fallbackComposeFile,
      projectDirectory: path.dirname(fallbackComposeFile),
    };
  }

  private isValidComposeProjectRoot(projectDirectory: string): boolean {
    const requiredEntries = ["backend", "frontend", "database"];
    return requiredEntries.every((entry) =>
      fsSync.existsSync(path.join(projectDirectory, entry)),
    );
  }

  private getEnvFilePath(runtimePath: string): string {
    return path.join(runtimePath, this.envFileName);
  }

  private async ensureRuntimeEnvFile(
    runtimePath: string,
  ): Promise<OperationResult> {
    const safeRuntimePath = assertRuntimePath(runtimePath);
    const envFilePath = this.getEnvFilePath(safeRuntimePath);

    try {
      await fs.access(envFilePath);
      return {
        ok: true,
        message: ".env.prod disponible.",
      };
    } catch {
      return {
        ok: false,
        message: `No se encontró .env.prod en ${envFilePath}. Ejecuta instalación o regeneración antes de iniciar el stack.`,
        errorCode: "ENV_FILE_MISSING",
      };
    }
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

  private async generateBcryptHashInBackend(
    runtimePath: string,
    plainPassword: string,
    onLogLine?: (event: RuntimeLogEvent) => void,
  ): Promise<OperationResult<string>> {
    const hashScript = [
      "const bcrypt = require('bcrypt');",
      "const password = process.argv[1];",
      "if (!password) { process.stderr.write('EMPTY_PASSWORD'); process.exit(1); }",
      "bcrypt.hash(password, 10)",
      "  .then((hash) => process.stdout.write(hash))",
      "  .catch((error) => { process.stderr.write(error?.message ?? String(error)); process.exit(1); });",
    ].join(" ");

    const result = await this.runCompose(
      runtimePath,
      ["exec", "-T", "backend", "node", "-e", hashScript, plainPassword],
      60_000,
      onLogLine,
    );

    if (!result.ok) {
      return {
        ok: false,
        message: result.stderr || "No se pudo generar hash bcrypt en backend.",
        errorCode: "DOCKER_ADMIN_REPAIR_FAILED",
      };
    }

    const hash = this.extractBcryptHash(result.stdout);
    if (!hash) {
      return {
        ok: false,
        message:
          "No se pudo extraer un hash bcrypt válido desde el backend para reparar credenciales.",
        errorCode: "DOCKER_ADMIN_REPAIR_FAILED",
      };
    }

    return {
      ok: true,
      message: "Hash bcrypt generado correctamente.",
      data: hash,
    };
  }

  private extractBcryptHash(rawOutput: string): string | null {
    const match = rawOutput.match(/\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/);
    return match?.[0] ?? null;
  }

  private toSqlLiteral(value: string): string {
    return `'${value.replaceAll("'", "''")}'`;
  }

  private buildAdminCredentialsRepairSql(input: {
    adminUsername: string;
    adminHash: string;
    adminEmail?: string;
    superAdminUsername: string;
    superAdminHash: string;
    superAdminEmail?: string;
  }): string {
    const adminUsername = this.toSqlLiteral(input.adminUsername.trim());
    const adminHash = this.toSqlLiteral(input.adminHash);
    const adminEmail = this.toSqlLiteral(
      input.adminEmail?.trim() || "admin@smarteconomat.com",
    );
    const superAdminUsername = this.toSqlLiteral(
      input.superAdminUsername.trim(),
    );
    const superAdminHash = this.toSqlLiteral(input.superAdminHash);
    const superAdminEmail = this.toSqlLiteral(
      input.superAdminEmail?.trim() || "superadmin@smarteconomat.com",
    );

    return [
      `UPDATE "usuario" SET
         "nombre" = 'Administrador Principal',
         "username" = ${adminUsername},
         "email" = ${adminEmail},
         "password" = ${adminHash},
         "rol" = 'ADMIN',
         "status" = 'ACTIVE',
         "activo" = TRUE,
         "must_change_password" = FALSE,
         "resetPasswordOtp" = NULL,
         "resetPasswordOtpExpires" = NULL,
         "deleted_at" = NULL,
         "deleted_by" = NULL,
         "updated_at" = NOW()
      WHERE UPPER("rol"::text) = 'ADMIN';`,
      `INSERT INTO "usuario" (
         "nombre",
         "username",
         "password",
         "email",
         "rol",
         "status",
         "must_change_password",
         "activo",
         "resetPasswordOtp",
         "resetPasswordOtpExpires"
       )
       SELECT
         'Administrador Principal',
         ${adminUsername},
         ${adminHash},
         ${adminEmail},
         'ADMIN',
         'ACTIVE',
         FALSE,
         TRUE,
         NULL,
         NULL
       WHERE NOT EXISTS (
         SELECT 1 FROM "usuario" WHERE UPPER("rol"::text) = 'ADMIN'
       );`,
      `UPDATE "usuario" SET
         "nombre" = 'Super Administrador',
         "username" = ${superAdminUsername},
         "email" = ${superAdminEmail},
         "password" = ${superAdminHash},
         "rol" = 'SUPER_ADMIN',
         "status" = 'ACTIVE',
         "activo" = TRUE,
         "must_change_password" = FALSE,
         "resetPasswordOtp" = NULL,
         "resetPasswordOtpExpires" = NULL,
         "deleted_at" = NULL,
         "deleted_by" = NULL,
         "updated_at" = NOW()
      WHERE UPPER("rol"::text) = 'SUPER_ADMIN';`,
      `INSERT INTO "usuario" (
         "nombre",
         "username",
         "password",
         "email",
         "rol",
         "status",
         "must_change_password",
         "activo",
         "resetPasswordOtp",
         "resetPasswordOtpExpires"
       )
       SELECT
         'Super Administrador',
         ${superAdminUsername},
         ${superAdminHash},
         ${superAdminEmail},
         'SUPER_ADMIN',
         'ACTIVE',
         FALSE,
         TRUE,
         NULL,
         NULL
       WHERE NOT EXISTS (
         SELECT 1 FROM "usuario" WHERE UPPER("rol"::text) = 'SUPER_ADMIN'
       );`,
    ].join(" ");
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
