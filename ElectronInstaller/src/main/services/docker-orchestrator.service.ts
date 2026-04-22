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
  private readonly envFileName = ".env.prod";
  private readonly startStackTimeoutMs = 3_600_000; // 1 hora en lugar de 20 min, permite build lento en cliente
  private readonly letsEncryptRenewTaskName =
    "SmartEconomat-LetsEncrypt-Renewal";

  constructor(
    private readonly pathResolver = new PathResolverService(),
    private readonly processRunner = new ProcessRunnerService(),
  ) {}

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
   * Levanta el stack de forma ligera: `up -d` sin --build ni --force-recreate.
   * Útil para la recuperación graduada Nivel 2 del Boot Guardian.
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
      command: "docker",
      args: [
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
      data: mergedLogs,
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
    superAdminUsername: string,
    superAdminPassword: string,
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
      superAdminUsername,
      superAdminHash: superAdminHashResult.data,
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
    const envFilePath = this.getEnvFilePath(safeRuntimePath);

    return this.processRunner.run({
      command: "docker",
      args: [...this.getComposeBaseArgs(safeRuntimePath), ...actionArgs],
      timeoutMs,
      cwd: this.pathResolver.getProjectRoot(),
      env: {
        ...process.env,
        SMARTECONOMAT_ENV_FILE: envFilePath,
      },
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
    const envFile = this.getEnvFilePath(runtimePath);
    return ["compose", "-f", composeFile, "--env-file", envFile];
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
    superAdminUsername: string;
    superAdminHash: string;
  }): string {
    const adminUsername = this.toSqlLiteral(input.adminUsername.trim());
    const adminHash = this.toSqlLiteral(input.adminHash);
    const superAdminUsername = this.toSqlLiteral(
      input.superAdminUsername.trim(),
    );
    const superAdminHash = this.toSqlLiteral(input.superAdminHash);

    return [
      `UPDATE "usuario" SET
         "nombre" = 'Administrador Principal',
         "username" = ${adminUsername},
         "email" = 'admin@smarteconomat.com',
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
         'admin@smarteconomat.com',
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
         "email" = 'superadmin@smarteconomat.com',
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
         'superadmin@smarteconomat.com',
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
