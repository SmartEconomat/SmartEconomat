import http from "node:http";
import https from "node:https";
import fs from "node:fs/promises";
import path from "node:path";

import { app, BrowserWindow, dialog, shell } from "electron";
import { z } from "zod";

import type {
  InstallJournalEntry,
  InstallerBootState,
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
import { PathResolverService } from "@main/services/path-resolver.service";
import { PreflightService } from "@main/services/preflight.service";
import { ProcessRunnerService } from "@main/services/process-runner.service";
import { BackupRestoreService } from "@main/services/backup-restore.service";
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
    installMode: z.union([z.literal("new"), z.literal("reinstall")]),
    adminUsername: z.string().min(4),
    adminPassword: z.string().min(12),
    superAdminUsername: z.string().min(4),
    superAdminPassword: z.string().min(12),
    verifyExistingAdminSession: z.boolean().default(false),
    repairAdminCredentialsOnFailure: z.boolean().default(false),
    verifyAdminUsername: z.string().optional(),
    verifyAdminPassword: z.string().optional(),
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
    backupDefaultDirectory: z.string().min(1),
    backupScheduleTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "La hora de backup debe tener formato HH:mm",
      ),
    backupRetentionDays: z.number().int().min(1).max(365),
    postgresPassword: z.string().optional(),
    redisPassword: z.string().optional(),
    jwtSecret: z.string().optional(),
    sentryDsn: z.string().optional(),
    viteSentryDsn: z.string().optional(),
    startupRunMigrations: z.boolean().optional(),
    httpPort: z.number().int().min(1).max(65535),
    httpsPort: z.number().int().min(1).max(65535),
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

    if (payload.httpPort === payload.httpsPort) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Los puertos HTTP y HTTPS no pueden ser iguales.",
        path: ["httpsPort"],
      });
    }

    if (
      payload.installMode === "reinstall" &&
      payload.verifyExistingAdminSession === true &&
      !payload.verifyAdminPassword?.trim()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "En reinstalación, la contraseña actual es obligatoria para validar login.",
        path: ["verifyAdminPassword"],
      });
    }
  });

const installerFilePickerSchema = z.object({
  title: z.string().min(1).max(120),
  defaultPath: z.string().optional(),
  buttonLabel: z.string().optional(),
  pickDirectories: z.boolean().optional(),
  filters: z
    .array(
      z.object({
        name: z.string().min(1),
        extensions: z.array(z.string().min(1)).min(1),
      }),
    )
    .optional(),
});

export class InstallerIPC {
  private readonly stateMachine = new InstallStateMachine();

  constructor(
    private window: BrowserWindow,
    private readonly debugLogService: DebugLogService,
    private readonly preflightService = new PreflightService(),
    private readonly envRendererService = new EnvRendererService(),
    private readonly tlsService = new TLSService(),
    private readonly dockerService = new DockerOrchestratorService(),
    private readonly journalService = new JournalService(),
    private readonly pathResolver = new PathResolverService(),
    private readonly processRunner = new ProcessRunnerService(),
    private readonly backupRestoreService = new BackupRestoreService(),
  ) {}

  setWindow(window: BrowserWindow): void {
    this.window = window;
  }

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

        // Configura el callback de logging para emitir logs en tiempo real
        this.preflightService.setLogCallback((message: string) => {
          this.emitRuntimeLog("PREFLIGHT", message);
        });

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
          properties: parsed.data.pickDirectories
            ? ["openDirectory", "createDirectory"]
            : ["openFile"],
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

    registerIpcHandleWithDebug(
      this.debugLogService,
      IPCChannels.installer.getBootState,
      async (): Promise<OperationResult<InstallerBootState>> => {
        const data = await this.getInstallerBootState();
        return {
          ok: true,
          message: data.installed
            ? "Instalación detectada. Arranque directo al panel habilitado."
            : "No se detectó una instalación validada.",
          data,
        };
      },
    );
  }

  private async runInstallation(
    payload: InstallerConfigPayload,
  ): Promise<OperationResult<InstallerStateSnapshot>> {
    try {
      this.emitRuntimeLog(
        "installer",
        "El instalador nativo ya terminó de copiar archivos. Ahora comienza la fase detallada de preparación del entorno.",
      );
      this.emitRuntimeLog(
        "installer",
        "Fase 1: comprobación de requisitos del sistema, WSL2, Docker Desktop, puertos y permisos.",
      );
      this.emitRuntimeLog(
        "installer",
        `Ruta de runtime activa: ${payload.runtimePath}`,
      );

      await this.cleanupWindowsResiduesForInstall(payload.runtimePath);

      await this.transition(
        payload.runtimePath,
        "PREFLIGHT",
        "Validando WSL2, Docker y prerequisitos del sistema",
      );
      this.emitRuntimeLog(
        "installer",
        "Comprobando espacio en disco, permisos de escritura, WSL2 y disponibilidad de Docker Desktop/Engine.",
      );
      const preflight = await this.preflightService.run(payload.runtimePath);
      const hasRepairableBlockers =
        preflight.data?.checks.some(
          (check) =>
            check.status === "BLOCKER" &&
            (check.repairable || check.repairAction === "auto-repair"),
        ) ?? false;

      if (!preflight.ok && hasRepairableBlockers) {
        this.emitRuntimeLog(
          "installer",
          "Bloqueantes reparables detectados. Liberando espacio y reintentando preflight...",
        );

        const pruneResult = await this.dockerService.pruneSafe(
          payload.runtimePath,
          "safe",
        );

        if (!pruneResult.ok) {
          this.emitRuntimeLog(
            "installer",
            `No fue posible aplicar la limpieza segura de Docker: ${pruneResult.message}`,
          );
        } else {
          this.emitRuntimeLog(
            "installer",
            "Limpieza segura de Docker completada antes de reintentar el preflight.",
          );
        }

        const repairAttempt = await this.preflightService.runAutoRepair(
          payload.runtimePath,
        );

        if (!repairAttempt.ok) {
          return this.fail(
            payload.runtimePath,
            repairAttempt.message,
            repairAttempt.errorCode ?? "INSTALL_PREFLIGHT_REPAIR_FAILED",
          );
        }

        if (repairAttempt.data) {
          this.emitRuntimeLog(
            "installer",
            "Auto-repair completado. Revalidando el entorno...",
          );
        }
      }

      if (!preflight.ok && !hasRepairableBlockers) {
        return this.fail(
          payload.runtimePath,
          preflight.message,
          "INSTALL_PREFLIGHT_FAILED",
        );
      }

      if (hasRepairableBlockers) {
        const repairedPreflight = await this.preflightService.run(
          payload.runtimePath,
        );

        if (!repairedPreflight.ok) {
          return this.fail(
            payload.runtimePath,
            repairedPreflight.message,
            repairedPreflight.errorCode ?? "INSTALL_PREFLIGHT_FAILED",
          );
        }
      }

      await this.transition(
        payload.runtimePath,
        "CONFIG_VALIDATION",
        "Validando nombres de instancia, puertos, rutas y credenciales",
      );
      this.emitRuntimeLog(
        "installer",
        "Revisando configuración elegida: runtime, puertos HTTP/HTTPS, backup, TLS y credenciales de administración.",
      );

      const hostsResult = await this.ensureWindowsHostsMapping(
        payload.localHost,
      );
      if (!hostsResult.ok) {
        return this.fail(
          payload.runtimePath,
          hostsResult.message,
          hostsResult.errorCode ?? "HOSTS_UPDATE_FAILED",
        );
      }
      this.emitRuntimeLog("installer", hostsResult.message);

      // ── Backup de seguridad pre-instalación ─────────────────────
      const existingInstallation =
        await this.detectExistingInstallation(payload.runtimePath);

      if (existingInstallation) {
        await this.transition(
          payload.runtimePath,
          "PRE_INSTALL_BACKUP",
          "Realizando backup de seguridad antes de continuar con la instalación",
        );

        if (payload.installMode === "new") {
          this.emitRuntimeLog(
            "installer",
            "⚠️ Instalación nueva detectada con datos existentes. Realizando backup preventivo antes de continuar...",
          );
        } else {
          this.emitRuntimeLog(
            "installer",
            "Reinstalación: realizando backup preventivo de los datos existentes antes de aplicar cambios...",
          );
        }

        const backupResult = await this.performPreInstallBackup(
          payload.runtimePath,
          payload.backupDefaultDirectory,
          payload.installMode,
        );

        if (backupResult.ok) {
          this.emitRuntimeLog(
            "installer",
            `Backup pre-instalación completado: ${backupResult.message}`,
          );
        } else {
          this.emitRuntimeLog(
            "installer",
            `⚠️ No se pudo completar el backup pre-instalación: ${backupResult.message}. Los datos existentes no pudieron respaldarse automáticamente.`,
          );

          // En reinstalación, un backup fallido no debe bloquear
          // En nueva instalación, solo advertimos (el usuario ya confirmó)
        }
      } else {
        this.emitRuntimeLog(
          "installer",
          "No se detectó instalación previa. Se omite el backup preventivo.",
        );
      }

      await this.transition(
        payload.runtimePath,
        "ENV_RENDER",
        "Generando .env.prod, secretos y rutas de runtime",
      );
      this.emitRuntimeLog(
        "installer",
        "Generando .env.prod con secretos, URLs, puertos, backup por defecto y variables de ejecución.",
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
        "Configurando certificados TLS locales o limpiando restos previos",
      );
      this.emitRuntimeLog(
        "installer",
        "Preparando certificados: creación de TLS local, limpieza de certificados previos o uso de certificados personalizados.",
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
        "Descomprimiendo recursos y levantando servicios Docker",
      );
      this.emitRuntimeLog(
        "installer",
        "Arrancando WSL2 si fuese necesario, iniciando Docker Desktop y levantando el stack de base de datos, backend y frontend.",
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
        "Esperando arranque de backend, migraciones y bootstrap interno",
      );
      this.emitRuntimeLog(
        "installer",
        "El backend está aplicando migraciones y arrancando servicios dependientes. Se mantiene la captura de logs en tiempo real.",
      );

      await this.transition(
        payload.runtimePath,
        "VERIFY",
        "Verificando salud y accesibilidad final",
      );
      this.emitRuntimeLog(
        "installer",
        "Verificando salud de backend, frontend, base de datos y Redis, además de la respuesta HTTP/HTTPS final.",
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

      let servicesHealth = healthResult.data ?? [];
      this.logHealthSummary(servicesHealth);

      const unhealthyServices = servicesHealth.filter(
        (service: ServiceHealth) => service.status === "unhealthy",
      );

      if (unhealthyServices.length > 0) {
        const recovered = await this.tryRecoverPostgresAuthMismatch(
          payload.runtimePath,
          unhealthyServices,
        );

        if (recovered) {
          this.emitRuntimeLog(
            "installer",
            "Revalidando estado del stack tras la reparación automática de base de datos.",
          );

          const recoveredHealth = await this.dockerService.getHealth(
            payload.runtimePath,
          );

          if (!recoveredHealth.ok) {
            return this.fail(
              payload.runtimePath,
              recoveredHealth.message,
              recoveredHealth.errorCode ?? "VERIFY_FAILED",
            );
          }

          servicesHealth = recoveredHealth.data ?? [];
          this.logHealthSummary(servicesHealth);
        }
      }

      const stillUnhealthyServices = servicesHealth.filter(
        (service: ServiceHealth) => service.status === "unhealthy",
      );

      if (stillUnhealthyServices.length > 0) {
        const services = stillUnhealthyServices
          .map((service: ServiceHealth) => service.service)
          .join(", ");
        return this.fail(
          payload.runtimePath,
          `Servicios no listos para producción: ${services}`,
          "VERIFY_FAILED",
        );
      }

      const nonReadyServices = servicesHealth.filter(
        (service: ServiceHealth) =>
          service.status === "starting" || service.status === "unknown",
      );

      if (nonReadyServices.length > 0) {
        const services = nonReadyServices
          .map((service: ServiceHealth) => service.service)
          .join(", ");
        this.emitRuntimeLog(
          "installer",
          `Servicios aún arrancando o sin healthcheck estable: ${services}. Se validará accesibilidad real antes de decidir el estado final.`,
        );
      }

      const publicUrl = this.resolvePublicUrl(payload);
      const reachabilityTargets = this.buildReachabilityTargets(payload);
      this.emitRuntimeLog(
        "installer",
        `Validando accesibilidad real antes de cerrar la instalación (targets: ${reachabilityTargets.join(", ")}).`,
      );

      const accessCheck = await this.verifyUrlReachability(
        reachabilityTargets,
        15,
        4_000,
      );
      if (!accessCheck.ok) {
        return this.fail(
          payload.runtimePath,
          accessCheck.message,
          "VERIFY_ACCESS_FAILED",
        );
      }

      const validatedPublicUrl = accessCheck.data?.validatedUrl ?? publicUrl;

      const shouldValidateAdminSession =
        payload.verifyExistingAdminSession === true;
      const shouldRepairAdminCredentials =
        shouldValidateAdminSession &&
        payload.repairAdminCredentialsOnFailure === true;

      const verificationUsername =
        payload.installMode === "reinstall" &&
        payload.verifyAdminUsername?.trim().length
          ? payload.verifyAdminUsername.trim()
          : payload.adminUsername;
      const verificationPassword =
        payload.installMode === "reinstall" &&
        payload.verifyAdminPassword?.trim().length
          ? payload.verifyAdminPassword
          : payload.adminPassword;

      if (!shouldValidateAdminSession) {
        this.emitRuntimeLog(
          "installer",
          "Validación de login admin omitida por configuración de instalación.",
        );
      }

      if (shouldValidateAdminSession) {
        this.emitRuntimeLog(
          "installer",
          `Validación de login admin activada por usuario (cuenta: ${verificationUsername}).`,
        );

        const adminLoginCheck = await this.verifyAdminLoginWithRetry(
          validatedPublicUrl,
          verificationUsername,
          verificationPassword,
          15,
          4_000,
        );

        if (!adminLoginCheck.ok && !shouldRepairAdminCredentials) {
          return this.fail(
            payload.runtimePath,
            "No se pudo validar login admin con las credenciales actuales y la reparación automática está desactivada por configuración.",
            "VERIFY_ADMIN_LOGIN_FAILED",
          );
        }

        if (!adminLoginCheck.ok && shouldRepairAdminCredentials) {
          this.emitRuntimeLog(
            "installer",
            "No se pudo validar login admin. Iniciando reparación automática de credenciales en la base de datos...",
          );

          const repairAdminResult =
            await this.dockerService.repairApplicationAdminCredentials(
              payload.runtimePath,
              payload.adminUsername,
              payload.adminPassword,
              payload.superAdminUsername,
              payload.useSamePasswordForBoth
                ? payload.adminPassword
                : payload.superAdminPassword,
              (event) => {
                this.emitRuntimeLog(event.service, event.line, event.timestamp);
              },
            );

          if (!repairAdminResult.ok) {
            return this.fail(
              payload.runtimePath,
              repairAdminResult.message,
              repairAdminResult.errorCode ?? "VERIFY_ADMIN_LOGIN_FAILED",
            );
          }

          await this.dockerService.restartService(
            payload.runtimePath,
            "backend",
          );

          const adminLoginRecheck = await this.verifyAdminLoginWithRetry(
            validatedPublicUrl,
            payload.adminUsername,
            payload.adminPassword,
            12,
            3_000,
          );

          if (!adminLoginRecheck.ok) {
            return this.fail(
              payload.runtimePath,
              adminLoginRecheck.message,
              adminLoginRecheck.errorCode ?? "VERIFY_ADMIN_LOGIN_FAILED",
            );
          }

          this.emitRuntimeLog(
            "installer",
            "Reparación automática de credenciales aplicada y validada correctamente.",
          );
        }

        if (adminLoginCheck.ok) {
          this.emitRuntimeLog(
            "installer",
            "Login admin validado correctamente con las credenciales actuales.",
          );
        }
      }

      if (payload.installMode === "reinstall") {
        this.emitRuntimeLog(
          "installer",
          "Instalación en modo reinstalación completada.",
        );
      }

      const backupScheduleResult =
        await this.backupRestoreService.configureScheduledBackup({
          runtimePath: payload.runtimePath,
          instanceName: payload.instanceName,
          backupFrequency: payload.backupFrequency,
          backupScheduleTime: payload.backupScheduleTime,
          backupDefaultDirectory: payload.backupDefaultDirectory,
        });

      if (!backupScheduleResult.ok) {
        this.emitRuntimeLog(
          "installer",
          `⚠️ No se pudo programar el backup automático: ${backupScheduleResult.message}. ` +
            "Puedes configurarlo manualmente desde el Panel de Control tras la instalación.",
        );
      } else {
        this.emitRuntimeLog("installer", backupScheduleResult.message);
      }

      const doneSnapshot = this.stateMachine.transition(
        "DONE",
        "Instalación completada y accesibilidad validada",
      );
      await this.log(payload.runtimePath, doneSnapshot, {
        runtimePath: payload.runtimePath,
      });
      await this.persistRuntimePathMarker(payload.runtimePath);
      this.emitProgress(doneSnapshot);
      this.emitRuntimeLog(
        "installer",
        `Instalación validada correctamente. La aplicación responde en ${validatedPublicUrl}`,
      );

      void shell.openExternal(validatedPublicUrl);

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

  private logHealthSummary(services: ServiceHealth[]): void {
    for (const service of services) {
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
  }

  private async tryRecoverPostgresAuthMismatch(
    runtimePath: string,
    blockedServices: ServiceHealth[],
  ): Promise<boolean> {
    const backendBlocked = blockedServices.some(
      (service) => service.service === "backend",
    );

    if (!backendBlocked) {
      return false;
    }

    const backendLogs = await this.dockerService.getServiceLogs(
      runtimePath,
      "backend",
      250,
    );

    if (!backendLogs.ok || !backendLogs.data) {
      return false;
    }

    const authMismatchDetected =
      /password authentication failed for user "postgres"/i.test(
        backendLogs.data,
      ) || /\b28P01\b/i.test(backendLogs.data);

    if (!authMismatchDetected) {
      return false;
    }

    this.emitRuntimeLog(
      "installer",
      "Detectado desajuste de credenciales PostgreSQL (28P01). Iniciando reparación automática segura.",
    );

    const repairResult = await this.dockerService.repairPostgresCredentials(
      runtimePath,
      (event) => {
        this.emitRuntimeLog(event.service, event.line, event.timestamp);
      },
    );

    if (!repairResult.ok) {
      this.emitRuntimeLog(
        "installer",
        `La reparación automática de credenciales no pudo completarse: ${repairResult.message}`,
      );
      return false;
    }

    const restartBackendResult = await this.dockerService.restartService(
      runtimePath,
      "backend",
    );

    if (!restartBackendResult.ok) {
      this.emitRuntimeLog(
        "installer",
        `No se pudo reiniciar backend tras reparar credenciales: ${restartBackendResult.message}`,
      );
      return false;
    }

    this.emitRuntimeLog(
      "installer",
      "Reparación automática aplicada: credenciales PostgreSQL alineadas y backend reiniciado.",
    );
    return true;
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

  private resolvePublicUrl(payload: InstallerConfigPayload): string {
    const protocol = payload.tlsProvider === "none" ? "http" : "https";
    const host =
      payload.tlsProvider === "none" ? "localhost" : payload.localHost;
    return `${protocol}://${host}`;
  }

  private async ensureWindowsHostsMapping(
    configuredHost: string,
  ): Promise<OperationResult> {
    if (process.platform !== "win32") {
      return {
        ok: true,
        message:
          "Sistema no Windows: no se requiere actualización del archivo hosts.",
      };
    }

    const aliases = Array.from(
      new Set(
        ["smarteconomat.app", configuredHost.trim().toLowerCase()].filter(
          (value) => value.length > 0,
        ),
      ),
    );

    if (aliases.length === 0) {
      return {
        ok: false,
        message: "No se pudieron determinar alias válidos para hosts.",
        errorCode: "HOSTS_INVALID_ALIASES",
      };
    }

    const aliasesLiteral = aliases
      .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    const aliasesLine = aliases.join(" ");
    const command = [
      "$hostsPath = Join-Path $env:SystemRoot 'System32\\drivers\\etc\\hosts'",
      `$aliasesPattern = '(?i)(^|\\s)(${aliasesLiteral})(?=\\s|$)'`,
      "$current = @()",
      "if (Test-Path -LiteralPath $hostsPath) {",
      "  $current = Get-Content -LiteralPath $hostsPath -ErrorAction Stop",
      "}",
      "$filtered = @()",
      "foreach ($line in $current) {",
      "  if ($line -match $aliasesPattern) { continue }",
      "  $filtered += $line",
      "}",
      `$filtered += '127.0.0.1 ${aliasesLine}'`,
      `$filtered += '::1 ${aliasesLine}'`,
      "Set-Content -LiteralPath $hostsPath -Value $filtered -Encoding ascii",
      "Write-Output 'HOSTS_UPDATED'",
    ].join("; ");

    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
      timeoutMs: 20_000,
    });

    if (!result.ok) {
      return {
        ok: false,
        message:
          "No se pudo actualizar hosts de Windows para smarteconomat.app. Ejecuta el instalador como administrador y reintenta.",
        errorCode: "HOSTS_UPDATE_FAILED",
      };
    }

    return {
      ok: true,
      message: `Hosts actualizado automáticamente: ${aliases.join(", ")} -> 127.0.0.1 / ::1.`,
    };
  }

  private async verifyUrlReachability(
    targetUrls: string[],
    attempts: number,
    delayMs: number,
  ): Promise<OperationResult<{ validatedUrl: string }>> {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      for (const targetUrl of targetUrls) {
        const success = await this.checkUrl(targetUrl);
        if (success) {
          return {
            ok: true,
            message: `Accesibilidad confirmada en ${targetUrl}.`,
            data: {
              validatedUrl: targetUrl,
            },
          };
        }
      }

      if (attempt < attempts) {
        this.emitRuntimeLog(
          "installer",
          `Verificación HTTP ${attempt}/${attempts} sin respuesta válida en ninguno de los targets. Reintentando...`,
        );
        await this.delay(delayMs);
      }
    }

    return {
      ok: false,
      message: `El stack inició, pero ninguno de los targets (${targetUrls.join(", ")}) respondió correctamente tras ${attempts} intentos.`,
      errorCode: "VERIFY_ACCESS_FAILED",
    };
  }

  private buildReachabilityTargets(payload: InstallerConfigPayload): string[] {
    const protocol = payload.tlsProvider === "none" ? "http" : "https";
    const primaryHost = payload.localHost.trim();
    const hosts = [primaryHost, "localhost", "127.0.0.1"];

    return hosts
      .filter((host) => host.length > 0)
      .map((host) => `${protocol}://${host}`)
      .filter((url, index, all) => all.indexOf(url) === index);
  }

  private async checkUrl(targetUrl: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const parsedUrl = new URL(targetUrl);
      const requestOptions = {
        method: "GET",
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
        path: parsedUrl.pathname || "/",
        timeout: 6_000,
        rejectUnauthorized: false,
      };

      const client = parsedUrl.protocol === "https:" ? https : http;
      const req = client.request(requestOptions, (response) => {
        response.resume();
        const statusCode = response.statusCode ?? 0;
        resolve(statusCode >= 200 && statusCode < 500);
      });

      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });

      req.on("error", () => {
        resolve(false);
      });

      req.end();
    });
  }

  private async verifyAdminLogin(
    targetUrl: string,
    username: string,
    password: string,
  ): Promise<OperationResult> {
    const ok = await this.checkAdminLogin(targetUrl, username, password);
    if (!ok) {
      return {
        ok: false,
        message:
          "La instalación no pudo validar las credenciales de administración iniciales.",
        errorCode: "VERIFY_ADMIN_LOGIN_FAILED",
      };
    }

    return {
      ok: true,
      message: "Credenciales administrativas validadas correctamente.",
    };
  }

  private async verifyAdminLoginWithRetry(
    targetUrl: string,
    username: string,
    password: string,
    attempts: number,
    delayMs: number,
  ): Promise<OperationResult> {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      this.emitRuntimeLog(
        "installer",
        `Validando credenciales administrativas (${attempt}/${attempts})...`,
      );

      const adminLoginCheck = await this.verifyAdminLogin(
        targetUrl,
        username,
        password,
      );

      if (adminLoginCheck.ok) {
        return adminLoginCheck;
      }

      if (attempt < attempts) {
        await this.delay(delayMs);
      }
    }

    return {
      ok: false,
      message:
        "La aplicación responde, pero no se pudo validar el acceso administrativo tras varios intentos.",
      errorCode: "VERIFY_ADMIN_LOGIN_FAILED",
    };
  }

  private async checkAdminLogin(
    targetUrl: string,
    username: string,
    password: string,
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const loginUrl = new URL("/api/v1/auth/login", targetUrl);
      const loginCandidates = this.buildLoginCandidates(username, password);

      const client = loginUrl.protocol === "https:" ? https : http;

      const tryCandidate = (index: number): void => {
        if (index >= loginCandidates.length) {
          resolve(false);
          return;
        }

        const candidatePayload = JSON.stringify(loginCandidates[index]);
        const requestOptions = {
          method: "POST",
          hostname: loginUrl.hostname,
          port: loginUrl.port || (loginUrl.protocol === "https:" ? 443 : 80),
          path: loginUrl.pathname,
          timeout: 8_000,
          rejectUnauthorized: false,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(candidatePayload),
          },
        };

        const req = client.request(requestOptions, (response) => {
          let responseBody = "";

          response.on("data", (chunk: Buffer) => {
            responseBody += chunk.toString("utf8");
          });

          response.on("end", () => {
            const statusCode = response.statusCode ?? 0;
            if (statusCode < 200 || statusCode >= 300) {
              tryCandidate(index + 1);
              return;
            }

            try {
              const parsed = JSON.parse(responseBody) as {
                access_token?: string;
                data?: {
                  access_token?: string;
                };
              };
              const tokenCandidate =
                parsed.access_token ?? parsed.data?.access_token ?? "";
              const okToken =
                typeof tokenCandidate === "string" && tokenCandidate.length > 0;
              if (okToken) {
                resolve(true);
                return;
              }

              tryCandidate(index + 1);
            } catch {
              tryCandidate(index + 1);
            }
          });
        });

        req.on("timeout", () => {
          req.destroy();
          tryCandidate(index + 1);
        });

        req.on("error", () => {
          tryCandidate(index + 1);
        });

        req.write(candidatePayload);
        req.end();
      };

      tryCandidate(0);
    });
  }

  private buildLoginCandidates(
    username: string,
    password: string,
  ): Array<Record<string, string>> {
    const normalized = username.trim();
    const candidates: Array<Record<string, string>> = [
      {
        email: normalized,
        password,
      },
      {
        username: normalized,
        password,
      },
      {
        email: `${normalized}@smarteconomat.com`,
        password,
      },
    ];

    return candidates.filter(
      (candidate, index, all) =>
        all.findIndex(
          (current) => JSON.stringify(current) === JSON.stringify(candidate),
        ) === index,
    );
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private async persistRuntimePathMarker(runtimePath: string): Promise<void> {
    try {
      const markerDir = path.join(
        app.getPath("appData"),
        "SmartEconomatInstaller",
      );
      await fs.mkdir(markerDir, { recursive: true });
      await fs.writeFile(
        path.join(markerDir, "runtime-path.txt"),
        `${runtimePath}\n`,
        "utf8",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo guardar runtime-path.txt";
      this.emitRuntimeLog(
        "installer",
        `Aviso: no se pudo persistir la ruta runtime para desinstalación automática (${message}).`,
      );
    }
  }

  private async getInstallerBootState(): Promise<InstallerBootState> {
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
        return {
          installed: true,
          runtimePath: candidate,
        };
      }
    }

    return {
      installed: false,
      runtimePath: runtimePathFromMarker || fallbackRuntimePath,
    };
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

  /**
   * Detecta si existe una instalación previa funcional verificando
   * que haya volúmenes Docker con datos del proyecto.
   */
  private async detectExistingInstallation(
    runtimePath: string,
  ): Promise<boolean> {
    // Verificar que exista el compose file y el .env
    const hasArtifacts = await this.hasInstalledRuntimeArtifacts(runtimePath);
    if (!hasArtifacts) {
      return false;
    }

    // Verificar si hay volúmenes Docker del proyecto con datos
    const volumeCheck = await this.processRunner.run({
      command: "docker",
      args: [
        "volume",
        "ls",
        "--filter",
        "name=smarteconomat",
        "--format",
        "{{.Name}}",
      ],
      timeoutMs: 15_000,
    });

    if (volumeCheck.ok && volumeCheck.stdout.trim().length > 0) {
      return true;
    }

    return false;
  }

  /**
   * Realiza un backup automático de seguridad antes de la instalación.
   * Intenta hacer pg_dump y respaldar uploads. Si Docker no está disponible
   * o la base de datos no está corriendo, se considera no-bloqueante.
   */
  private async performPreInstallBackup(
    runtimePath: string,
    backupDirectory: string,
    installMode: "new" | "reinstall",
  ): Promise<OperationResult> {
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .slice(0, 19);
    const label = `pre-${installMode}-${timestamp}`;

    try {
      const backupDir = backupDirectory || path.join(runtimePath, "backups");
      await fs.mkdir(backupDir, { recursive: true });

      const backupResult = await this.backupRestoreService.backupNow({
        runtimePath,
        label,
        destinationDir: backupDir,
      });

      if (backupResult.ok) {
        return {
          ok: true,
          message: `Backup pre-instalación guardado como "${label}" en ${backupDir}`,
        };
      }

      return {
        ok: false,
        message: backupResult.message,
        errorCode: backupResult.errorCode ?? "PRE_INSTALL_BACKUP_FAILED",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error inesperado en backup";
      return {
        ok: false,
        message,
        errorCode: "PRE_INSTALL_BACKUP_ERROR",
      };
    }
  }

  private async cleanupWindowsResiduesForInstall(
    runtimePath: string,
  ): Promise<void> {
    if (process.platform !== "win32") {
      return;
    }

    const scriptPath = path.join(
      this.pathResolver.getInstallerScriptsRoot(),
      "ops",
      "uninstall-clean.ps1",
    );

    try {
      await fs.access(scriptPath);
    } catch {
      this.emitRuntimeLog(
        "installer",
        "No se encontró script de limpieza preventiva en Windows. Continuando instalación.",
      );
      return;
    }

    this.emitRuntimeLog(
      "installer",
      "Ejecutando limpieza preventiva de residuos Windows antes de instalar...",
    );

    const cleanupResult = await this.processRunner.run({
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
        "-SkipDockerCleanup",
        "-SkipShortcutsCleanup",
        "-SkipHostsCleanup",
        "-SkipRegistryCleanup",
      ],
      timeoutMs: 180_000,
    });

    if (cleanupResult.ok) {
      this.emitRuntimeLog(
        "installer",
        "Limpieza preventiva de residuos completada correctamente.",
      );
      return;
    }

    const detail = cleanupResult.stderr || cleanupResult.message;
    this.emitRuntimeLog(
      "installer",
      `Aviso: limpieza preventiva incompleta (${detail}). Se continuará con la instalación.`,
    );
  }
}

export function registerInstallerIpc(
  window: BrowserWindow,
  debugLogService: DebugLogService,
): InstallerIPC {
  const installerIpc = new InstallerIPC(window, debugLogService);
  installerIpc.register();
  return installerIpc;
}
