import { BrowserWindow, dialog, shell } from "electron";
import { z } from "zod";

import type {
  InstallJournalEntry,
  InstallerConfigPayload,
  InstallerFilePickerPayload,
  InstallerProgressEvent,
  PreflightReport,
  InstallerStateSnapshot,
  OperationResult,
  PortRepairPayload,
  RuntimeLogEvent,
  RuntimePaths,
  ServiceHealth,
} from "@shared/contracts";
import { IPCChannels } from "@shared/ipc-channels";

import { registerIpcHandleWithDebug } from "@main/ipc/ipc-handler-with-debug";
import type { DebugLogService } from "@main/services/debug-log.service";
import { EnvRendererService } from "@main/services/env-renderer.service";
import { DockerOrchestratorService } from "@main/services/docker-orchestrator.service";
import { JournalService } from "@main/services/journal.service";
import { PreflightService } from "@main/services/preflight.service";
import { TLSService } from "@main/services/tls.service";
import { InstallStateMachine } from "@main/state/install-state.machine";

const runtimePathSchema = z.object({
  runtimePath: z.string().min(1),
});

const portRepairSchema = z.object({
  runtimePath: z.string().min(1),
  port: z.number().int().min(1).max(65535),
});

const installerConfigSchema = z
  .object({
    runtimePath: z.string().min(1),
    instanceName: z.string().min(3),
    adminUsername: z.string().min(4),
    adminPassword: z.string().min(12),
    superAdminUsername: z.string().min(4),
    superAdminPassword: z.string().min(12),
    useSamePasswordForBoth: z.boolean(),
    localHost: z.string().min(3),
    timezone: z.string().min(3),
    tlsProvider: z.union([
      z.literal("selfsigned"),
      z.literal("none"),
      z.literal("custom"),
    ]),
    customCertFullchainPath: z.string().optional(),
    customCertPrivkeyPath: z.string().optional(),
    backupFrequency: z.union([
      z.literal("off"),
      z.literal("daily"),
      z.literal("weekly"),
    ]),
    backupRetentionDays: z.number().int().min(1).max(365),
    postgresPassword: z.string().optional(),
    redisPassword: z.string().optional(),
    jwtSecret: z.string().optional(),
  })
  .superRefine((payload, context) => {
    if (payload.tlsProvider === "custom") {
      if (!payload.customCertFullchainPath?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "El certificado fullchain es obligatorio cuando TLS está en modo personalizado.",
          path: ["customCertFullchainPath"],
        });
      }

      if (!payload.customCertPrivkeyPath?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "La clave privada es obligatoria cuando TLS está en modo personalizado.",
          path: ["customCertPrivkeyPath"],
        });
      }
    }

    if (
      payload.adminUsername.trim().toLowerCase() ===
      payload.superAdminUsername.trim().toLowerCase()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Admin y superadmin deben tener nombres de usuario diferentes.",
        path: ["superAdminUsername"],
      });
    }

    if (
      payload.useSamePasswordForBoth &&
      payload.adminPassword !== payload.superAdminPassword
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Con la sincronización activa, ambas contraseñas deben ser iguales.",
        path: ["superAdminPassword"],
      });
    }
  });

const installerFilePickerSchema = z.object({
  title: z.string().min(1).max(120),
  defaultPath: z.string().optional(),
  buttonLabel: z.string().optional(),
  filters: z
    .array(
      z.object({
        name: z.string().min(1),
        extensions: z.array(z.string().min(1)).min(1),
      }),
    )
    .optional(),
});

/** Servicio del proceso principal: InstallerIPC. */
export class InstallerIPC {
  private readonly stateMachine = new InstallStateMachine();

  /**
   * Construye la instancia del servicio.
   * @param {BrowserWindow} window - Entrada esperada por la función.
   * @param {DebugLogService} debugLogService - Entrada esperada por la función.
   * @param {PreflightService} preflightService - Entrada esperada por la función.
   * @param {EnvRendererService} envRendererService - Entrada esperada por la función.
   * @param {TLSService} tlsService - Entrada esperada por la función.
   * @param {DockerOrchestratorService} dockerService - Entrada esperada por la función.
   * @param {JournalService} journalService - Entrada esperada por la función.
   */
  constructor(
    private window: BrowserWindow,
    private readonly debugLogService: DebugLogService,
    private readonly preflightService = new PreflightService(),
    private readonly envRendererService = new EnvRendererService(),
    private readonly tlsService = new TLSService(),
    private readonly dockerService = new DockerOrchestratorService(),
    private readonly journalService = new JournalService(),
  ) {}

  /**
   * Establece la referencia o configuración interna.
   * @param {BrowserWindow} window - Entrada esperada por la función.
   * @returns {void} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  setWindow(window: BrowserWindow): void {
    this.window = window;
  }

  /**
   * Registra manejadores y canaliza IPC o integración con el proceso principal.
   * @returns {void} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  register(): void {
    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.installer.runPreflight,
      async (
        _event,
        payload: RuntimePaths,
      ): Promise<OperationResult<PreflightReport>> => {
        const parsed = runtimePathSchema.safeParse(payload);
        if (!parsed.success) {
          return {
            ok: false,
            message: parsed.error.message,
            errorCode: "INVALID_PREFLIGHT_PAYLOAD",
          };
        }
        return this.preflightService.run(parsed.data.runtimePath);
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.installer.runAutoRepair,
      async (
        _event,
        payload: RuntimePaths,
      ): Promise<OperationResult<PreflightReport>> => {
        const parsed = runtimePathSchema.safeParse(payload);
        if (!parsed.success) {
          return {
            ok: false,
            message: parsed.error.message,
            errorCode: "INVALID_AUTOREPAIR_PAYLOAD",
          };
        }
        return this.preflightService.runAutoRepair(parsed.data.runtimePath);
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.installer.releaseBusyPort,
      async (
        _event,
        payload: PortRepairPayload,
      ): Promise<OperationResult<PreflightReport>> => {
        const parsed = portRepairSchema.safeParse(payload);
        if (!parsed.success) {
          return {
            ok: false,
            message: parsed.error.message,
            errorCode: "INVALID_PORT_REPAIR_PAYLOAD",
          };
        }

        return this.preflightService.releaseBusyPort(parsed.data);
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.installer.startInstall,
      async (
        _event,
        payload: InstallerConfigPayload,
      ): Promise<OperationResult<InstallerStateSnapshot>> => {
        const parsed = installerConfigSchema.safeParse(payload);
        if (!parsed.success) {
          return {
            ok: false,
            message: parsed.error.message,
            errorCode: "INVALID_INSTALL_PAYLOAD",
          };
        }

        return this.runInstallation(parsed.data);
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.installer.pickFile,
      async (
        _event,
        payload: InstallerFilePickerPayload,
      ): Promise<OperationResult<string>> => {
        const parsed = installerFilePickerSchema.safeParse(payload);
        if (!parsed.success) {
          return {
            ok: false,
            message: parsed.error.message,
            errorCode: "INVALID_FILE_PICKER_PAYLOAD",
          };
        }

        const selection = await dialog.showOpenDialog(this.window, {
          title: parsed.data.title,
          defaultPath: parsed.data.defaultPath,
          buttonLabel: parsed.data.buttonLabel,
          properties: ["openFile"],
          filters: parsed.data.filters,
        });

        if (selection.canceled || selection.filePaths.length === 0) {
          return {
            ok: true,
            message: "Selección cancelada por el usuario.",
            data: "",
          };
        }

        return {
          ok: true,
          message: "Archivo seleccionado correctamente.",
          data: selection.filePaths[0],
        };
      },
    );

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.installer.getState,
      async (): Promise<OperationResult<InstallerStateSnapshot>> => ({
        ok: true,
        message: "Estado actual del installer.",
        data: this.stateMachine.getSnapshot(),
      }),
    );
  }

  private async runInstallation(
    payload: InstallerConfigPayload,
  ): Promise<OperationResult<InstallerStateSnapshot>> {
    try {
      this.emitRuntimeLog("installer", "Iniciando despliegue Docker...");
      this.emitRuntimeLog(
        "installer",
        "Preparando flujo transaccional de instalación...",
      );
      this.emitRuntimeLog(
        "installer",
        `Ruta de runtime activa: ${payload.runtimePath}`,
      );

      await this.transition(
        payload.runtimePath,
        "PREFLIGHT",
        "Ejecutando preflight",
      );
      const preflight = await this.preflightService.run(payload.runtimePath);
      if (!preflight.ok) {
        return this.fail(
          payload.runtimePath,
          preflight.message,
          "INSTALL_PREFLIGHT_FAILED",
        );
      }

      await this.transition(
        payload.runtimePath,
        "CONFIG_VALIDATION",
        "Validando configuración",
      );

      await this.transition(
        payload.runtimePath,
        "ENV_RENDER",
        "Generando .env.prod",
      );
      const envResult = await this.envRendererService.render(payload);
      if (!envResult.ok) {
        return this.fail(
          payload.runtimePath,
          envResult.message,
          envResult.errorCode ?? "ENV_RENDER_FAILED",
        );
      }

      await this.transition(
        payload.runtimePath,
        "TLS_SETUP",
        "Configurando certificados TLS locales",
      );
      const tlsResult = await this.tlsService.setup(payload);
      if (!tlsResult.ok) {
        return this.fail(
          payload.runtimePath,
          tlsResult.message,
          tlsResult.errorCode ?? "TLS_SETUP_FAILED",
        );
      }

      await this.transition(
        payload.runtimePath,
        "DOCKER_DEPLOY",
        "Levantando stack Docker",
      );
      const deployResult = await this.dockerService.startStack(
        payload.runtimePath,
        (event) => {
          this.emitRuntimeLog(event.service, event.line, event.timestamp);
        },
      );
      if (!deployResult.ok) {
        return this.fail(
          payload.runtimePath,
          deployResult.message,
          deployResult.errorCode ?? "DOCKER_DEPLOY_FAILED",
        );
      }

      await this.transition(
        payload.runtimePath,
        "INITIALIZE_APP",
        "Inicialización delegada al bootstrap de backend en arranque",
      );

      await this.transition(
        payload.runtimePath,
        "VERIFY",
        "Verificando salud del stack",
      );
      const healthResult = await this.dockerService.getHealth(
        payload.runtimePath,
      );

      if (!healthResult.ok) {
        return this.fail(
          payload.runtimePath,
          healthResult.message,
          healthResult.errorCode ?? "VERIFY_FAILED",
        );
      }

      for (const service of healthResult.data ?? []) {
        const statusLabel =
          service.status === "healthy" || service.status === "running"
            ? "operativo"
            : service.status === "starting"
              ? "en proceso de arranque"
              : service.status === "unknown"
                ? "pendiente de verificación"
                : `con incidencia (${service.status})`;
        this.emitRuntimeLog(
          "installer",
          `Servicio ${service.service} ${statusLabel}.`,
        );
      }

      const unhealthyServices = (healthResult.data ?? []).filter(
        (service: ServiceHealth) => service.status === "unhealthy",
      );

      if (unhealthyServices.length > 0) {
        const services = unhealthyServices
          .map((service: ServiceHealth) => service.service)
          .join(", ");
        return this.fail(
          payload.runtimePath,
          `Servicios no saludables: ${services}`,
          "VERIFY_FAILED",
        );
      }

      const doneSnapshot = this.stateMachine.transition(
        "DONE",
        "Instalación completada",
      );
      await this.log(payload.runtimePath, doneSnapshot, {
        runtimePath: payload.runtimePath,
      });
      this.emitProgress(doneSnapshot);
      this.emitRuntimeLog(
        "installer",
        `Aplicación SmartEconomat desplegada y accesible en https://${payload.localHost}`,
      );

      void shell.openExternal(`https://${payload.localHost}`);

      return {
        ok: true,
        message: "Instalación completada correctamente.",
        data: doneSnapshot,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error inesperado de instalación";
      return this.fail(
        payload.runtimePath,
        message,
        "INSTALL_UNEXPECTED_ERROR",
      );
    }
  }

  private async transition(
    runtimePath: string,
    nextState: InstallerStateSnapshot["state"],
    message: string,
  ): Promise<void> {
    const snapshot = this.stateMachine.transition(nextState, message);
    await this.log(runtimePath, snapshot, { runtimePath });
    this.emitProgress(snapshot);
    this.emitRuntimeLog(
      "installer",
      `${nextState} · ${message}`,
      snapshot.timestamp,
    );
  }

  private async fail(
    runtimePath: string,
    message: string,
    errorCode: string,
  ): Promise<OperationResult<InstallerStateSnapshot>> {
    const snapshot = this.stateMachine.forceState("FAILED", message, errorCode);
    await this.log(runtimePath, snapshot, { runtimePath });
    this.emitProgress(snapshot);
    this.emitRuntimeLog("installer", `FAILED · ${message}`, snapshot.timestamp);

    return {
      ok: false,
      message,
      errorCode,
      data: snapshot,
    };
  }

  private emitProgress(snapshot: InstallerStateSnapshot): void {
    const event: InstallerProgressEvent = { snapshot };
    this.debugLogService.logIpcPush(IPCChannels.installer.progressEvent, event);
    this.window.webContents.send(IPCChannels.installer.progressEvent, event);
  }

  private emitRuntimeLog(
    service: RuntimeLogEvent["service"],
    line: RuntimeLogEvent["line"],
    timestamp?: RuntimeLogEvent["timestamp"],
  ): void {
    const event: RuntimeLogEvent = {
      service,
      line,
      timestamp: timestamp ?? new Date().toISOString(),
    };

    this.debugLogService.logIpcPush(IPCChannels.runtime.streamLogEvent, event);
    this.window.webContents.send(IPCChannels.runtime.streamLogEvent, event);
  }

  private async log(
    runtimePath: string,
    snapshot: InstallerStateSnapshot,
    context?: Record<string, string>,
  ): Promise<void> {
    const entry: InstallJournalEntry = {
      ...snapshot,
      context,
    };

    await this.journalService.append(runtimePath, entry);
  }
}

/**
 * Registra manejadores y canaliza IPC o integración con el proceso principal.
 * @param {BrowserWindow} window - Entrada esperada por la función.
 * @param {DebugLogService} debugLogService - Entrada esperada por la función.
 * @returns {InstallerIPC} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function registerInstallerIpc(
  window: BrowserWindow,
  debugLogService: DebugLogService,
): InstallerIPC {
  const installerIpc = new InstallerIPC(window, debugLogService);
  installerIpc.register();
  return installerIpc;
}
