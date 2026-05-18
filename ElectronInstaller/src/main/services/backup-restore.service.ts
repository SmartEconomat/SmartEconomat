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

export function parseBackupMetadata(rawOutput: string): BackupMetadata | null {
  try {
    return JSON.parse(rawOutput) as BackupMetadata;
  } catch {
    return null;
  }
}

export class BackupRestoreService {
  constructor(
    private readonly pathResolver = new PathResolverService(),
    private readonly processRunner = new ProcessRunnerService(),
  ) {}

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
    const command = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${launcherPath}"`;

    const privilegedResult = await this.processRunner.run({
      command: "schtasks",
      args: [
        "/Create",
        "/F",
        "/TN",
        taskName,
        "/SC",
        "DAILY",
        "/MO",
        String(intervalDays),
        "/ST",
        config.backupScheduleTime,
        "/TR",
        command,
        "/RL",
        "HIGHEST",
        "/RU",
        "SYSTEM",
      ],
      timeoutMs: 60_000,
    });

    if (privilegedResult.ok) {
      return {
        ok: true,
        message: `Backup automático programado cada ${intervalDays} días a las ${config.backupScheduleTime}.`,
      };
    }

    const privilegedErrorText = `${privilegedResult.stderr || ""} ${privilegedResult.message || ""}`;
    const accessDenied = /acceso denegado|access is denied/i.test(
      privilegedErrorText,
    );

    if (accessDenied) {
      const userFallbackResult = await this.processRunner.run({
        command: "schtasks",
        args: [
          "/Create",
          "/F",
          "/TN",
          taskName,
          "/SC",
          "DAILY",
          "/MO",
          String(intervalDays),
          "/ST",
          config.backupScheduleTime,
          "/TR",
          command,
        ],
        timeoutMs: 60_000,
      });

      if (userFallbackResult.ok) {
        return {
          ok: true,
          message:
            `Backup automático programado cada ${intervalDays} días a las ${config.backupScheduleTime}. ` +
            "Nota: se programó en contexto de usuario por falta de permisos para SYSTEM.",
        };
      }

      return {
        ok: false,
        message:
          `${userFallbackResult.stderr || userFallbackResult.message} ` +
          `(diagnóstico scheduler: TR length=${command.length}, launcher=${launcherPath}, modo=fallback-user)`,
        errorCode: "BACKUP_SCHEDULE_FAILED",
      };
    }

    if (!privilegedResult.ok) {
      return {
        ok: false,
        message:
          `${privilegedResult.stderr || privilegedResult.message} ` +
          `(diagnóstico scheduler: TR length=${command.length}, launcher=${launcherPath})`,
        errorCode: "BACKUP_SCHEDULE_FAILED",
      };
    }

    return {
      ok: true,
      message: `Backup automático programado cada ${intervalDays} días a las ${config.backupScheduleTime}.`,
    };
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
