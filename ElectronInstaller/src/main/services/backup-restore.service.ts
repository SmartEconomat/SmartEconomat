import path from "node:path";

import type {
  BackupMetadata,
  BackupPayload,
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
      "--label",
      payload.label,
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
      return {
        ok: true,
        message: "Backup generado correctamente.",
        data: metadata,
      };
    }

    return {
      ok: false,
      message: "No se pudo parsear metadata de backup.",
      errorCode: "BACKUP_METADATA_PARSE_FAILED",
    };
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
}
