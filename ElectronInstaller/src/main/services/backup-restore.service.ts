import fs from "node:fs/promises";
import path from "node:path";

import type {
  BackupMetadata,
  BackupPayload,
  InstallerConfigPayload,
  OperationResult,
  RestorePayload,
  RuntimePaths,
} from "@shared/contracts";

import { assertDangerConfirmation } from "@main/security/command-allowlist";

import { PathResolverService } from "./path-resolver.service";
import { ProcessRunnerService } from "./process-runner.service";

/**
 * Interpreta y normaliza datos de texto o estructuras intermedias.
 * @param {string} rawOutput - Entrada esperada por la función.
 * @returns {BackupMetadata | null} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function parseBackupMetadata(rawOutput: string): BackupMetadata | null {
  try {
    return JSON.parse(rawOutput) as BackupMetadata;
  } catch {
    return null;
  }
}

/** Servicio del proceso principal: BackupRestoreService. */
export class BackupRestoreService {
  /**
   * Construye la instancia del servicio.
   * @param {PathResolverService} pathResolver - Entrada esperada por la función.
   * @param {ProcessRunnerService} processRunner - Entrada esperada por la función.
   */
  constructor(
    private readonly pathResolver = new PathResolverService(),
    private readonly processRunner = new ProcessRunnerService(),
  ) {}

  /**
   * Expone la operación "backupNow" del instalador SmartEconomat.
   * @param {BackupPayload} payload - Entrada esperada por la función.
   * @returns {Promise<OperationResult<BackupMetadata>>} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  async backupNow(
    payload: BackupPayload,
  ): Promise<OperationResult<BackupMetadata>> {
    const result = await this.runOpsScript("backup", payload.runtimePath, [
      process.platform === "win32" ? "-Label" : "--label",
      payload.label,
      process.platform === "win32" ? "-OutputDir" : "--output-dir",
      payload.destinationDir,
    ]);

    if (!result.ok) {
      return {
        ok: false,
        message: result.stderr,
        errorCode: "BACKUP_FAILED",
      };
    }

    const metadata = parseBackupMetadata(result.stdout);
    if (metadata) {
      const resolvedArchivePath =
        metadata.archivePath && metadata.archivePath.trim().length > 0
          ? metadata.archivePath
          : path.join(payload.destinationDir, metadata.archiveName);

      const archiveValidation =
        await this.validateGeneratedArchive(resolvedArchivePath);

      if (!archiveValidation.ok) {
        return archiveValidation;
      }

      return {
        ok: true,
        message: "Backup generado correctamente.",
        data: {
          ...metadata,
          archivePath: resolvedArchivePath,
        },
      };
    }

    return {
      ok: false,
      message: "No se pudo parsear metadata de backup.",
      errorCode: "BACKUP_METADATA_PARSE_FAILED",
    };
  }

  private async validateGeneratedArchive(
    archivePath: string,
  ): Promise<OperationResult<BackupMetadata>> {
    try {
      const stats = await fs.stat(archivePath);
      if (!stats.isFile() || stats.size <= 0) {
        return {
          ok: false,
          message: "El archivo de backup generado no es válido.",
          errorCode: "BACKUP_FILE_INVALID",
        };
      }

      return {
        ok: true,
        message: "Archivo de backup validado.",
      };
    } catch {
      return {
        ok: false,
        message: "No se encontró el archivo de backup generado.",
        errorCode: "BACKUP_FILE_MISSING",
      };
    }
  }

  /**
   * Expone la operación "restoreFrom" del instalador SmartEconomat.
   * @param {RestorePayload} payload - Entrada esperada por la función.
   * @returns {Promise<OperationResult<undefined>>} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  async restoreFrom(payload: RestorePayload): Promise<OperationResult> {
    assertDangerConfirmation(payload.confirmationPhrase);

    const result = await this.runOpsScript("restore", payload.runtimePath, [
      "--artifact",
      payload.artifactPath,
    ]);

    return result.ok
      ? { ok: true, message: "Restore completado correctamente." }
      : { ok: false, message: result.stderr, errorCode: "RESTORE_FAILED" };
  }

  /**
   * Expone la operación "healthCheck" del instalador SmartEconomat.
   * @param {RuntimePaths} payload - Entrada esperada por la función.
   * @returns {Promise<OperationResult<string>>} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  async healthCheck(payload: RuntimePaths): Promise<OperationResult<string>> {
    const result = await this.runOpsScript(
      "health-check",
      payload.runtimePath,
      [],
    );

    return result.ok
      ? { ok: true, message: "Health-check ejecutado.", data: result.stdout }
      : { ok: false, message: result.stderr, errorCode: "HEALTHCHECK_FAILED" };
  }

  /**
   * Expone la operación "configureScheduledBackup" del instalador SmartEconomat.
   * @param {Pick<InstallerConfigPayload, "runtimePath" | "instanceName" | "backupFrequency" | "backupScheduleTime" | "backupDefaultDirectory">} config - Entrada esperada por la función.
   * @returns {Promise<OperationResult<undefined>>} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  async configureScheduledBackup(
    config: Pick<
      InstallerConfigPayload,
      | "runtimePath"
      | "instanceName"
      | "backupFrequency"
      | "backupScheduleTime"
      | "backupDefaultDirectory"
    >,
  ): Promise<OperationResult> {
    if (process.platform !== "win32") {
      return {
        ok: true,
        message:
          "La programación automática de backups se gestionará fuera de Windows.",
      };
    }

    const taskName = this.buildScheduledTaskName(config.instanceName);
    if (config.backupFrequency === "off") {
      return this.deleteScheduledBackupTask(taskName);
    }

    const intervalDays = config.backupFrequency === "daily" ? 1 : 7;
    const projectRoot = this.pathResolver.getProjectRoot();
    const scriptPath = path.join(
      this.pathResolver.getInstallerScriptsRoot(),
      "ops",
      "backup.ps1",
    );

    const outputDir =
      config.backupDefaultDirectory.trim().length > 0
        ? config.backupDefaultDirectory.trim()
        : path.join(config.runtimePath, "backups");

    const launcherPath = await this.writeWindowsScheduledBackupLauncher({
      runtimePath: config.runtimePath,
      scriptPath,
      projectRoot,
      outputDir,
    });

    const successMessage = (mode: string): string =>
      `Backup automático programado cada ${intervalDays} días a las ${config.backupScheduleTime} (${mode}).`;

    // ── Nivel 1: Register-ScheduledTask con SYSTEM ──
    const systemResult = await this.registerScheduledTaskPowerShell({
      taskName,
      launcherPath,
      intervalDays,
      scheduleTime: config.backupScheduleTime,
      principal: "SYSTEM",
    });

    if (systemResult.ok) {
      return { ok: true, message: successMessage("SYSTEM") };
    }

    // ── Nivel 2: Register-ScheduledTask con usuario actual ──
    if (this.isElevationOrAccessError(systemResult.detail)) {
      const userResult = await this.registerScheduledTaskPowerShell({
        taskName,
        launcherPath,
        intervalDays,
        scheduleTime: config.backupScheduleTime,
        principal: "BUILTIN\\Users",
      });

      if (userResult.ok) {
        return {
          ok: true,
          message:
            successMessage("contexto de usuario") +
            " Nota: sin permisos para SYSTEM.",
        };
      }
    }

    // ── Nivel 3: schtasks clásico (fallback) ──
    const schtasksResult = await this.registerWithSchtasks({
      taskName,
      launcherPath,
      intervalDays,
      scheduleTime: config.backupScheduleTime,
    });

    if (schtasksResult.ok) {
      return {
        ok: true,
        message: successMessage("schtasks fallback"),
      };
    }

    // ── Nivel 4: todos los métodos fallaron ──
    return {
      ok: false,
      message:
        `No se pudo programar el backup automático tras múltiples intentos. ` +
        `Último error: ${schtasksResult.detail} ` +
        `(launcher=${launcherPath})`,
      errorCode: "BACKUP_SCHEDULE_FAILED",
    };
  }

  private async registerScheduledTaskPowerShell(input: {
    taskName: string;
    launcherPath: string;
    intervalDays: number;
    scheduleTime: string;
    principal: "SYSTEM" | "BUILTIN\\Users";
  }): Promise<{ ok: boolean; detail: string }> {
    const escapedTaskName = input.taskName.replaceAll("'", "''");
    const escapedLauncher = input.launcherPath.replaceAll("'", "''");

    const principalSnippet =
      input.principal === "SYSTEM"
        ? "$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest"
        : "$principal = New-ScheduledTaskPrincipal -GroupId 'BUILTIN\\Users' -RunLevel Limited";

    const psScript = [
      "$ErrorActionPreference = 'Stop'",
      `$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ('-NoProfile -ExecutionPolicy Bypass -File "' + '${escapedLauncher}' + '"')`,
      `$trigger = New-ScheduledTaskTrigger -Daily -DaysInterval ${input.intervalDays} -At '${input.scheduleTime}'`,
      principalSnippet,
      `$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 2)`,
      `Register-ScheduledTask -Force -TaskName '${escapedTaskName}' -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'SmartEconomat - Backup automático programado'`,
    ].join("; ");

    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", psScript],
      timeoutMs: 60_000,
    });

    return {
      ok: result.ok,
      detail: result.ok
        ? ""
        : `${result.stderr || ""} ${result.message || ""}`.trim(),
    };
  }

  private async registerWithSchtasks(input: {
    taskName: string;
    launcherPath: string;
    intervalDays: number;
    scheduleTime: string;
  }): Promise<{ ok: boolean; detail: string }> {
    const trValue = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${input.launcherPath}"`;

    const result = await this.processRunner.run({
      command: "schtasks",
      args: [
        "/Create",
        "/F",
        "/TN",
        input.taskName,
        "/SC",
        "DAILY",
        "/MO",
        String(input.intervalDays),
        "/ST",
        input.scheduleTime,
        "/TR",
        trValue,
      ],
      timeoutMs: 60_000,
    });

    return {
      ok: result.ok,
      detail: result.ok
        ? ""
        : `${result.stderr || ""} ${result.message || ""}`.trim(),
    };
  }

  private isElevationOrAccessError(detail: string): boolean {
    return /acceso denegado|access is denied|0x80070005|error 740|requires elevation|elevation required|UnauthorizedAccessException|not have the required privileges/i.test(
      detail,
    );
  }

  private async writeWindowsScheduledBackupLauncher(input: {
    runtimePath: string;
    scriptPath: string;
    projectRoot: string;
    outputDir: string;
  }): Promise<string> {
    const launcherDir = path.join(input.runtimePath, "scheduled-tasks");
    const launcherPath = path.join(launcherDir, "run-backup-scheduled.ps1");

    await fs.mkdir(launcherDir, { recursive: true });

    const scriptLiteral = this.toPowerShellSingleQuotedLiteral(
      input.scriptPath,
    );
    const runtimeLiteral = this.toPowerShellSingleQuotedLiteral(
      input.runtimePath,
    );
    const projectRootLiteral = this.toPowerShellSingleQuotedLiteral(
      input.projectRoot,
    );
    const outputDirLiteral = this.toPowerShellSingleQuotedLiteral(
      input.outputDir,
    );

    const launcherContent = [
      "$ErrorActionPreference = 'Stop'",
      `& ${scriptLiteral} -RuntimePath ${runtimeLiteral} -ProjectRoot ${projectRootLiteral} -Label 'scheduled' -OutputDir ${outputDirLiteral}`,
      "if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }",
    ].join("\n");

    await fs.writeFile(launcherPath, launcherContent, {
      encoding: "utf8",
    });

    return launcherPath;
  }

  private toPowerShellSingleQuotedLiteral(value: string): string {
    return `'${value.replaceAll("'", "''")}'`;
  }

  private runOpsScript(
    scriptBaseName: string,
    runtimePath: string,
    extraArgs: string[],
  ) {
    const scriptsRoot = this.pathResolver.getInstallerScriptsRoot();
    const projectRoot = this.pathResolver.getProjectRoot();

    if (process.platform === "win32") {
      const scriptPath = path.join(scriptsRoot, "ops", `${scriptBaseName}.ps1`);
      return this.processRunner.run({
        command: "powershell",
        args: [
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          scriptPath,
          "-RuntimePath",
          runtimePath,
          "-ProjectRoot",
          projectRoot,
          ...extraArgs,
        ],
        timeoutMs: 240_000,
      });
    }

    const scriptPath = path.join(scriptsRoot, "ops", `${scriptBaseName}.sh`);

    return this.processRunner.run({
      command: "bash",
      args: [
        scriptPath,
        "--runtime-path",
        runtimePath,
        "--project-root",
        projectRoot,
        ...extraArgs,
      ],
      timeoutMs: 240_000,
    });
  }

  private buildScheduledTaskName(instanceName: string): string {
    const normalized = instanceName
      .trim()
      .replace(/[^a-zA-Z0-9\- _]/g, "-")
      .replace(/\s+/g, " ");

    return `SmartEconomat Backup - ${normalized || "default"}`;
  }

  private async deleteScheduledBackupTask(
    taskName: string,
  ): Promise<OperationResult> {
    const escapedTaskName = taskName.replaceAll("'", "''");
    const psScript =
      `$ErrorActionPreference = 'Stop'; ` +
      `if (Get-ScheduledTask -TaskName '${escapedTaskName}' -ErrorAction SilentlyContinue) { ` +
      `Unregister-ScheduledTask -TaskName '${escapedTaskName}' -Confirm:$false ` +
      `} else { Write-Output 'NOT_FOUND' }`;

    const psResult = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", psScript],
      timeoutMs: 30_000,
    });

    if (psResult.ok) {
      const notFound = psResult.stdout.includes("NOT_FOUND");
      return {
        ok: true,
        message: notFound
          ? "No existía una tarea programada previa de backups."
          : "Tarea programada de backups eliminada.",
      };
    }

    // Fallback: schtasks clásico
    const result = await this.processRunner.run({
      command: "schtasks",
      args: ["/Delete", "/TN", taskName, "/F"],
      timeoutMs: 30_000,
    });

    if (result.ok) {
      return {
        ok: true,
        message: "Tarea programada de backups eliminada.",
      };
    }

    const notFound =
      /cannot find the file specified|no se puede encontrar/i.test(
        `${result.stderr} ${result.message}`,
      );

    if (notFound) {
      return {
        ok: true,
        message: "No existía una tarea programada previa de backups.",
      };
    }

    return {
      ok: false,
      message: result.stderr || result.message,
      errorCode: "BACKUP_SCHEDULE_DELETE_FAILED",
    };
  }
}
