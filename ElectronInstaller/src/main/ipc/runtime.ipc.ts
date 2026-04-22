import fs from "node:fs/promises";
import path from "node:path";

import { app, BrowserWindow, dialog } from "electron";
import { z } from "zod";

import type {
  BackupPayload,
  ExportVisibleLogsPayload,
  HealthUpdateEvent,
  OperationResult,
  PrunePayload,
  RestorePayload,
  RuntimePaths,
  TailLogsPayload,
  UninstallPayload,
} from "@shared/contracts";
import { IPCChannels } from "@shared/ipc-channels";
import {
  buildRuntimeLogsExportFileName,
  serializeVisibleRuntimeLogs,
} from "@shared/runtime-log-export";

import { registerIpcHandleWithDebug } from "@main/ipc/ipc-handler-with-debug";
import type { DebugLogService } from "@main/services/debug-log.service";
import type { BootGuardianService } from "@main/services/boot-guardian.service";
import { assertDangerConfirmation } from "@main/security/command-allowlist";
import { BackupRestoreService } from "@main/services/backup-restore.service";
import { CertificateService } from "@main/services/certificate.service";
import { DiagnosticsService } from "@main/services/diagnostics.service";
import { DockerAutostartService } from "@main/services/docker-autostart.service";
import { DockerOrchestratorService } from "@main/services/docker-orchestrator.service";
import { EnvRendererService } from "@main/services/env-renderer.service";
import { PathResolverService } from "@main/services/path-resolver.service";
import { ProcessRunnerService } from "@main/services/process-runner.service";

const runtimePathSchema = z.object({ runtimePath: z.string().min(1) });
const tailLogsSchema = z.object({
  runtimePath: z.string().min(1),
  service: z.union([
    z.literal("frontend"),
    z.literal("backend"),
    z.literal("db"),
    z.literal("redis"),
  ]),
  lines: z.number().int().min(1).max(1000),
});
const pruneSchema = z.object({
  runtimePath: z.string().min(1),
  level: z.union([z.literal("safe"), z.literal("aggressive")]),
  confirmationPhrase: z.string().min(1),
});
const backupSchema = z.object({
  runtimePath: z.string().min(1),
  label: z.string().min(1).max(50),
  destinationDir: z.string().min(1),
});
const restoreSchema = z.object({
  runtimePath: z.string().min(1),
  artifactPath: z.string().min(1),
  confirmationPhrase: z.string().min(1),
});
const uninstallSchema = z.object({
  runtimePath: z.string().min(1),
  confirmationPhrase: z.string().min(1),
});
const exportVisibleLogsSchema = z.object({
  runtimePath: z.string().min(1),
  logs: z
    .array(
      z.object({
        service: z.string().min(1).max(50),
        line: z.string().min(1).max(20_000),
        timestamp: z.string().min(1).max(120),
      }),
    )
    .min(1)
    .max(600),
  suggestedFileName: z.string().max(160).optional(),
});

export class RuntimeIPC {
  constructor(
    private window: BrowserWindow,
    private readonly debugLogService: DebugLogService,
    private readonly dockerService = new DockerOrchestratorService(),
    private readonly envRendererService = new EnvRendererService(),
    private readonly backupService = new BackupRestoreService(),
    private readonly diagnosticsService = new DiagnosticsService(),
    private readonly certificateService = new CertificateService(),
    private readonly dockerAutostartService = new DockerAutostartService(),
    private readonly processRunner = new ProcessRunnerService(),
    private readonly pathResolver = new PathResolverService(),
  ) {}

  private bootGuardian: BootGuardianService | null = null;

  setBootGuardian(guardian: BootGuardianService | null): void {
    this.bootGuardian = guardian;
  }

  setWindow(window: BrowserWindow): void {
    this.window = window;
  }

  register(): void {
    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.runtime.startStack,
      async (_event, payload: RuntimePaths) => {
        const parsed = runtimePathSchema.safeParse(payload);
        if (!parsed.success) {
          return invalidPayload(parsed.error.message);
        }
        return this.runWithEnvAutoRecovery(parsed.data.runtimePath, () =>
          this.dockerService.startStack(parsed.data.runtimePath),
        );
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.runtime.stopStack,
      async (_event, payload: RuntimePaths) => {
        const parsed = runtimePathSchema.safeParse(payload);
        if (!parsed.success) {
          return invalidPayload(parsed.error.message);
        }
        return this.dockerService.stopStack(parsed.data.runtimePath);
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.runtime.restartStack,
      async (_event, payload: RuntimePaths) => {
        const parsed = runtimePathSchema.safeParse(payload);
        if (!parsed.success) {
          return invalidPayload(parsed.error.message);
        }
        return this.runWithEnvAutoRecovery(parsed.data.runtimePath, () =>
          this.dockerService.restartStack(parsed.data.runtimePath),
        );
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.runtime.getHealth,
      async (_event, payload: RuntimePaths) => {
        const parsed = runtimePathSchema.safeParse(payload);
        if (!parsed.success) {
          return invalidPayload(parsed.error.message);
        }
        return this.dockerService.getHealth(parsed.data.runtimePath);
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.runtime.tailLogs,
      async (_event, payload: TailLogsPayload) => {
        const parsed = tailLogsSchema.safeParse(payload);
        if (!parsed.success) {
          return invalidPayload(parsed.error.message);
        }

        return this.dockerService.tailLogs(parsed.data, (logEvent) => {
          this.debugLogService.logIpcPush(
            IPCChannels.runtime.streamLogEvent,
            logEvent,
          );
          this.window.webContents.send(
            IPCChannels.runtime.streamLogEvent,
            logEvent,
          );
        });
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.runtime.stopLogStream,
      async () => {
        return this.dockerService.stopLogStream();
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.runtime.exportVisibleLogs,
      async (_event, payload: ExportVisibleLogsPayload) => {
        const parsed = exportVisibleLogsSchema.safeParse(payload);
        if (!parsed.success) {
          return invalidPayload(parsed.error.message);
        }

        return this.exportVisibleLogs(parsed.data);
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.runtime.pruneSafe,
      async (_event, payload: PrunePayload) => {
        const parsed = pruneSchema.safeParse(payload);
        if (!parsed.success) {
          return invalidPayload(parsed.error.message);
        }

        try {
          assertDangerConfirmation(parsed.data.confirmationPhrase);
        } catch (error) {
          return {
            ok: false,
            message:
              error instanceof Error ? error.message : "Confirmación inválida",
            errorCode: "INVALID_CONFIRMATION",
          };
        }

        return this.dockerService.pruneSafe(
          parsed.data.runtimePath,
          parsed.data.level,
        );
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.runtime.backupNow,
      async (_event, payload: BackupPayload) => {
        const parsed = backupSchema.safeParse(payload);
        if (!parsed.success) {
          return invalidPayload(parsed.error.message);
        }
        return this.backupService.backupNow(parsed.data);
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.runtime.restoreFrom,
      async (_event, payload: RestorePayload) => {
        const parsed = restoreSchema.safeParse(payload);
        if (!parsed.success) {
          return invalidPayload(parsed.error.message);
        }
        return this.backupService.restoreFrom(parsed.data);
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.runtime.diagnostics,
      async (_event, payload: RuntimePaths) => {
        const parsed = runtimePathSchema.safeParse(payload);
        if (!parsed.success) {
          return invalidPayload(parsed.error.message);
        }
        return this.diagnosticsService.generate(parsed.data);
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.runtime.reinstallCertificate,
      async (_event, payload: RuntimePaths) => {
        const parsed = runtimePathSchema.safeParse(payload);
        if (!parsed.success) {
          return invalidPayload(parsed.error.message);
        }
        return this.certificateService.reinstallCertificateToTrustStore(
          parsed.data.runtimePath,
        );
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.runtime.getDockerAutostartStatus,
      async () => {
        return this.dockerAutostartService.getAutostartStatus();
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.runtime.setDockerAutostart,
      async (_event, payload: { enable: boolean }) => {
        if (payload.enable) {
          return this.dockerAutostartService.enableAutostart();
        }
        return this.dockerAutostartService.disableAutostart();
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.runtime.uninstall,
      async (_event, payload: UninstallPayload) => {
        const parsed = uninstallSchema.safeParse(payload);
        if (!parsed.success) {
          return invalidPayload(parsed.error.message);
        }

        try {
          assertDangerConfirmation(parsed.data.confirmationPhrase);
        } catch (error) {
          return {
            ok: false,
            message:
              error instanceof Error ? error.message : "Confirmación inválida",
            errorCode: "INVALID_CONFIRMATION",
          };
        }

        return this.runFullUninstall(parsed.data.runtimePath);
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.runtime.getWatchdogStatus,
      async (): Promise<OperationResult<HealthUpdateEvent>> => {
        if (!this.bootGuardian) {
          return {
            ok: false,
            message: "Boot Guardian no está activo.",
            errorCode: "GUARDIAN_NOT_ACTIVE",
          };
        }

        return {
          ok: true,
          message: "Estado del watchdog obtenido.",
          data: this.bootGuardian.getStatus(),
        };
      },
    );
  }

  private async exportVisibleLogs(
    payload: ExportVisibleLogsPayload,
  ): Promise<OperationResult<string>> {
    const diagnosticsDir = path.join(payload.runtimePath, "diagnostics");
    await fs.mkdir(diagnosticsDir, { recursive: true });

    const selection = await dialog.showSaveDialog(this.window, {
      title: "Exportar logs visibles",
      buttonLabel: "Guardar logs",
      defaultPath: path.join(
        diagnosticsDir,
        sanitizeSuggestedFileName(payload.suggestedFileName),
      ),
      filters: [
        {
          name: "Texto plano",
          extensions: ["txt", "log"],
        },
        {
          name: "Todos los archivos",
          extensions: ["*"],
        },
      ],
    });

    if (selection.canceled || !selection.filePath) {
      return {
        ok: true,
        message: "Exportación cancelada por el usuario.",
        data: "",
      };
    }

    await fs.writeFile(
      selection.filePath,
      serializeVisibleRuntimeLogs(payload.logs),
      "utf8",
    );

    return {
      ok: true,
      message: "Logs exportados correctamente.",
      data: selection.filePath,
    };
  }

  private async runWithEnvAutoRecovery(
    runtimePath: string,
    operation: () => Promise<OperationResult>,
  ): Promise<OperationResult> {
    const initialResult = await operation();
    if (initialResult.ok || initialResult.errorCode !== "ENV_FILE_MISSING") {
      return initialResult;
    }

    this.emitRuntimeLog(
      "runtime",
      "No se encontró .env.prod. Intentando regeneración automática desde snapshot seguro.",
    );

    const regeneration =
      await this.envRendererService.regenerateFromSnapshot(runtimePath);

    if (!regeneration.ok) {
      this.emitRuntimeLog(
        "runtime",
        `Regeneración automática fallida: ${regeneration.message}`,
      );
      return {
        ok: false,
        message: `${initialResult.message} ${regeneration.message}`,
        errorCode: regeneration.errorCode ?? initialResult.errorCode,
      };
    }

    this.emitRuntimeLog(
      "runtime",
      "Regeneración de .env.prod completada. Reintentando operación Docker.",
    );

    return operation();
  }

  private async runFullUninstall(
    runtimePath: string,
  ): Promise<OperationResult> {
    if (process.platform !== "win32") {
      return {
        ok: false,
        message:
          "La desinstalación automática solo está disponible en Windows.",
        errorCode: "UNSUPPORTED_PLATFORM",
      };
    }

    const scriptPath = path.join(
      this.pathResolver.getInstallerScriptsRoot(),
      "ops",
      "uninstall-clean.ps1",
    );

    try {
      await fs.access(scriptPath);
    } catch {
      return {
        ok: false,
        message: `No se encontró el script de desinstalación: ${scriptPath}`,
        errorCode: "UNINSTALL_SCRIPT_MISSING",
      };
    }

    this.emitRuntimeLog(
      "uninstall",
      "Iniciando desinstalación completa de SmartEconomat...",
    );

    const result = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath,
        "-RuntimePath",
        runtimePath,
        "-InstallDir",
        this.pathResolver.getInstallerRoot(),
        "-PreserveRuntime",
      ],
      timeoutMs: 300_000,
      onStdoutLine: (line) => this.emitRuntimeLog("uninstall", line),
      onStderrLine: (line) => this.emitRuntimeLog("uninstall", line),
    });

    if (!result.ok) {
      const detail = result.stderr || result.message;
      this.emitRuntimeLog("uninstall", `Desinstalación fallida: ${detail}`);
      return {
        ok: false,
        message: `Error durante la desinstalación: ${detail}`,
        errorCode: "UNINSTALL_FAILED",
      };
    }

    this.emitRuntimeLog(
      "uninstall",
      "Desinstalación completada. La aplicación se cerrará automáticamente.",
    );

    setTimeout(() => {
      app.quit();
    }, 2000);

    return {
      ok: true,
      message: "Desinstalación completada correctamente.",
    };
  }

  private emitRuntimeLog(service: string, line: string): void {
    const event = {
      service,
      line,
      timestamp: new Date().toISOString(),
    };

    this.debugLogService.logIpcPush(IPCChannels.runtime.streamLogEvent, event);
    this.window.webContents.send(IPCChannels.runtime.streamLogEvent, event);
  }
}

function sanitizeSuggestedFileName(rawValue?: string): string {
  const fallback = buildRuntimeLogsExportFileName();
  const baseName = path.basename(rawValue?.trim() || fallback);
  const sanitized = baseName.replace(/[^A-Za-z0-9._-]/g, "-");

  if (sanitized.length === 0) {
    return fallback;
  }

  const normalized = sanitized.toLowerCase();
  return normalized.endsWith(".txt") || normalized.endsWith(".log")
    ? sanitized
    : `${sanitized}.txt`;
}

function invalidPayload(message: string): OperationResult {
  return {
    ok: false,
    message,
    errorCode: "INVALID_PAYLOAD",
  };
}

export function registerRuntimeIpc(
  window: BrowserWindow,
  debugLogService: DebugLogService,
): RuntimeIPC {
  const runtimeIpc = new RuntimeIPC(window, debugLogService);
  runtimeIpc.register();
  return runtimeIpc;
}
