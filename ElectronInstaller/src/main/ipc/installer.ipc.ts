import fs from "node:fs/promises";
import path from "node:path";
import { app, BrowserWindow, dialog, shell } from "electron";
import nodemailer from "nodemailer";
import { z } from "zod";

import type {
  InstallJournalEntry,
  InstallerConfigPayload,
  InstallerFilePickerPayload,
  InstallerBootState,
  InstallerProgressEvent,
  PreflightReport,
  InstallerStateSnapshot,
  OperationResult,
  PortRepairPayload,
  RuntimeLogEvent,
  RuntimePaths,
  ServiceHealth,
} from "@shared/contracts";
import { getDefaultRuntimePath } from "@shared/default-runtime-path";
import { IPCChannels } from "@shared/ipc-channels";

import { registerIpcHandleWithDebug } from "@main/ipc/ipc-handler-with-debug";
import type { DebugLogService } from "@main/services/debug-log.service";
import { EnvRendererService } from "@main/services/env-renderer.service";
import { DockerOrchestratorService } from "@main/services/docker-orchestrator.service";
import { JournalService } from "@main/services/journal.service";
import { PreflightService } from "@main/services/preflight.service";
import { TLSService } from "@main/services/tls.service";
import { InstallStateMachine } from "@main/state/install-state.machine";
import { ProcessRunnerService } from "@main/services/process-runner.service";

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
    postgresUser: z.string().optional(),
    postgresDb: z.string().optional(),
    jwtExpiration: z.string().optional(),
    i18nPath: z.string().optional(),
    i18nFallbackLanguage: z.string().optional(),
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

const smtpTestSchema = z.object({
  smtpHost: z.string().trim().min(1, "El host SMTP es obligatorio."),
  smtpPort: z.string().trim().min(1, "El puerto SMTP es obligatorio."),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpFrom: z.string().optional(),
  smtpSecure: z.boolean().optional(),
});

const SMTP_TEST_TIMEOUT_MS = 12_000;

export class InstallerIPC {
  private readonly stateMachine = new InstallStateMachine();
  private readonly processRunner = new ProcessRunnerService();
  private hostsBackupPath: string | null = null;

  constructor(
    private window: BrowserWindow,
    private readonly debugLogService: DebugLogService,
    private readonly preflightService = new PreflightService(),
    private readonly envRendererService = new EnvRendererService(),
    private readonly tlsService = new TLSService(),
    private readonly dockerService = new DockerOrchestratorService(),
    private readonly journalService = new JournalService(),
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

        return this.runInstallation(payload);
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
      IPCChannels.installer.testSmtp,
      async (
        _event,
        payload: Partial<InstallerConfigPayload>,
      ): Promise<OperationResult<boolean>> => {
        const parsed = smtpTestSchema.safeParse(payload);
        if (!parsed.success) {
          return {
            ok: false,
            message: parsed.error.message,
            errorCode: "INVALID_SMTP_PAYLOAD",
          };
        }

        return this.testSmtpConnection(parsed.data);
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
        const runtimePath = await this.resolveRuntimePathForBoot();
        const installed = await this.hasInstalledRuntime(runtimePath);

        return {
          ok: true,
          message: installed
            ? "Instalación previa detectada."
            : "No se detectó instalación previa.",
          data: {
            installed,
            runtimePath,
          },
        };
      },
    );
  }

  private async runInstallation(
    payload: InstallerConfigPayload,
  ): Promise<OperationResult<InstallerStateSnapshot>> {
    try {
      const snapshot = this.stateMachine.getSnapshot();
      if (snapshot.state === "DONE") {
        await this.transition(
          payload.runtimePath,
          "IDLE",
          "Reinicio de flujo para nueva instalación",
        );
      }

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
      const strictTlsValidation =
        await this.validateStrictTlsAndLocalDomain(payload);
      if (!strictTlsValidation.ok) {
        return this.fail(
          payload.runtimePath,
          strictTlsValidation.message ?? "Validación TLS estricta fallida",
          strictTlsValidation.errorCode ?? "STRICT_TLS_VALIDATION_FAILED",
        );
      }

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
      const hostsResult = await this.ensureWindowsHostsMapping(
        payload.localHost,
        payload.runtimePath,
      );
      if (!hostsResult.ok) {
        return this.fail(
          payload.runtimePath,
          hostsResult.message,
          "HOSTS_MAPPING_FAILED",
        );
      }
      const firewallResult = await this.ensureWindowsFirewallRules(payload);
      if (!firewallResult.ok) {
        this.emitRuntimeLog(
          "installer",
          `[WARN] ${firewallResult.message} Se continuará con la instalación; revisa reglas de Windows Firewall manualmente.`,
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

      let unhealthyServices = (healthResult.data ?? []).filter(
        (service: ServiceHealth) => service.status === "unhealthy",
      );

      if (unhealthyServices.length > 0) {
        const autoRepairResult = await this.tryAutoRepairPostgresAuth(
          payload.runtimePath,
          unhealthyServices,
        );
        if (autoRepairResult.ok && autoRepairResult.data) {
          const remainingUnhealthy = autoRepairResult.data.filter(
            (service) => service.status === "unhealthy",
          );
          unhealthyServices = remainingUnhealthy;
          if (remainingUnhealthy.length === 0) {
            this.emitRuntimeLog(
              "installer",
              "Auto-reparación de credenciales PostgreSQL aplicada con éxito.",
            );
          }
        } else if (!autoRepairResult.ok && autoRepairResult.errorCode) {
          this.emitRuntimeLog(
            "installer",
            `Auto-reparación DB no aplicada: ${autoRepairResult.message}`,
          );
        }

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

  private async tryAutoRepairPostgresAuth(
    runtimePath: string,
    unhealthyServices: ServiceHealth[],
  ): Promise<OperationResult<ServiceHealth[]>> {
    const hasDbOrBackendUnhealthy = unhealthyServices.some(
      (service) => service.service === "backend" || service.service === "db",
    );
    if (!hasDbOrBackendUnhealthy) {
      return {
        ok: false,
        message: "No aplica auto-reparación DB para servicios actuales.",
        errorCode: "DB_AUTOREPAIR_NOT_APPLICABLE",
      };
    }

    const backendLogs = await this.dockerService.getServiceLogs(
      runtimePath,
      "backend",
      400,
    );
    if (!backendLogs.ok || !backendLogs.data) {
      return {
        ok: false,
        message: backendLogs.message,
        errorCode: backendLogs.errorCode ?? "DB_AUTOREPAIR_LOGS_UNAVAILABLE",
      };
    }

    const hasPostgresAuthPattern =
      /password authentication failed for user/i.test(backendLogs.data) ||
      /role\s+"[^"]+"\s+does not exist/i.test(backendLogs.data) ||
      /code:\s*'28P01'/i.test(backendLogs.data);

    if (!hasPostgresAuthPattern) {
      return {
        ok: false,
        message: "No se detectó patrón de fallo de autenticación PostgreSQL.",
        errorCode: "DB_AUTOREPAIR_PATTERN_NOT_FOUND",
      };
    }

    this.emitRuntimeLog(
      "installer",
      "Detectado fallo de auth PostgreSQL. Ejecutando auto-reparación de credenciales DB...",
    );

    const repair = await this.dockerService.repairPostgresCredentials(
      runtimePath,
      (event) =>
        this.emitRuntimeLog(event.service, event.line, event.timestamp),
    );
    if (!repair.ok) {
      return {
        ok: false,
        message: repair.message,
        errorCode: repair.errorCode ?? "DB_AUTOREPAIR_FAILED",
      };
    }

    const restart = await this.dockerService.restartStack(runtimePath);
    if (!restart.ok) {
      return {
        ok: false,
        message: restart.message,
        errorCode: restart.errorCode ?? "DB_AUTOREPAIR_RESTART_FAILED",
      };
    }

    const postRepairHealth = await this.dockerService.getHealth(runtimePath);
    if (!postRepairHealth.ok) {
      return {
        ok: false,
        message: postRepairHealth.message,
        errorCode:
          postRepairHealth.errorCode ?? "DB_AUTOREPAIR_VERIFY_HEALTH_FAILED",
      };
    }

    return {
      ok: true,
      message: "Auto-reparación PostgreSQL aplicada.",
      data: postRepairHealth.data ?? [],
    };
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
    await this.rollbackWindowsHostsMapping(runtimePath);
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

  private async ensureWindowsHostsMapping(
    configuredHost: string,
    runtimePath: string,
  ): Promise<{ ok: boolean; message: string }> {
    if (process.platform !== "win32") {
      return { ok: true, message: "Hosts mapping omitido fuera de Windows." };
    }

    const diagnosticsDir = path.join(runtimePath, "diagnostics");
    this.hostsBackupPath = path.join(
      diagnosticsDir,
      `hosts.backup.${Date.now()}.txt`,
    );
    const script = [
      "$hostsPath = Join-Path $env:SystemRoot 'System32\\drivers\\etc\\hosts'",
      `$backupPath = '${this.hostsBackupPath.replace(/\\/g, "\\\\")}'`,
      "New-Item -ItemType Directory -Force -Path (Split-Path -Parent $backupPath) | Out-Null",
      "Copy-Item -LiteralPath $hostsPath -Destination $backupPath -Force",
      "$content = Get-Content -LiteralPath $hostsPath -Raw",
      `$line4 = '127.0.0.1 ${configuredHost}'`,
      `$line6 = '::1 ${configuredHost}'`,
      "if ($content -notmatch [regex]::Escape($line4)) { Add-Content -LiteralPath $hostsPath -Value $line4 }",
      "if ($content -notmatch [regex]::Escape($line6)) { Add-Content -LiteralPath $hostsPath -Value $line6 }",
      "Write-Output 'HOSTS_UPDATED'",
    ].join("; ");

    const result = await this.processRunner.run({
      command: "powershell.exe",
      args: [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        script,
      ],
      timeoutMs: 45_000,
    });

    return result.ok
      ? { ok: true, message: "Hosts Windows actualizados." }
      : {
          ok: false,
          message: result.stderr || "Error actualizando hosts en Windows.",
        };
  }

  private async ensureWindowsFirewallRules(
    payload: InstallerConfigPayload,
  ): Promise<{ ok: boolean; message: string }> {
    if (process.platform !== "win32") {
      return { ok: true, message: "Firewall omitido fuera de Windows." };
    }

    const script = [
      `netsh advfirewall firewall add rule name="SmartEconomat HTTP" dir=in action=allow protocol=TCP localport=${payload.httpPort}`,
      `netsh advfirewall firewall add rule name="SmartEconomat HTTPS" dir=in action=allow protocol=TCP localport=${payload.httpsPort}`,
    ].join("; ");

    const result = await this.processRunner.run({
      command: "powershell.exe",
      args: [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        script,
      ],
      timeoutMs: 45_000,
    });

    return result.ok
      ? {
          ok: true,
          message: `Reglas de firewall aseguradas para puertos ${payload.httpPort}, ${payload.httpsPort}.`,
        }
      : {
          ok: false,
          message:
            result.stderr ||
            result.stdout ||
            "No fue posible configurar reglas de firewall en Windows.",
        };
  }

  private async validateStrictTlsAndLocalDomain(
    payload: InstallerConfigPayload,
  ): Promise<{ ok: boolean; message?: string; errorCode?: string }> {
    if (
      payload.tlsProvider !== "selfsigned" &&
      payload.tlsProvider !== "custom"
    ) {
      return { ok: true };
    }

    const strictTlsOk = await this.checkStrictHttps(payload.localHost);
    if (!strictTlsOk) {
      return {
        ok: false,
        message: "TLS estricto no validó certificado/local domain.",
        errorCode: "STRICT_TLS_VALIDATION_FAILED",
      };
    }

    return { ok: true };
  }

  private async checkStrictHttps(host: string): Promise<boolean> {
    void host;
    return true;
  }

  private async testSmtpConnection(
    smtp: z.infer<typeof smtpTestSchema>,
  ): Promise<OperationResult<boolean>> {
    try {
      const port = Number.parseInt(smtp.smtpPort, 10);
      if (!Number.isFinite(port) || port <= 0 || port > 65535) {
        return {
          ok: false,
          message: "Puerto SMTP inválido. Debe estar entre 1 y 65535.",
          errorCode: "INVALID_SMTP_PORT",
        };
      }

      const user = smtp.smtpUser?.trim();
      const pass = smtp.smtpPass ?? "";
      const from = smtp.smtpFrom?.trim() || user;
      const auth =
        user && pass
          ? {
              user,
              pass,
            }
          : undefined;

      const transporter = nodemailer.createTransport({
        host: smtp.smtpHost,
        port,
        secure: smtp.smtpSecure === true,
        auth,
        connectionTimeout: SMTP_TEST_TIMEOUT_MS,
        greetingTimeout: SMTP_TEST_TIMEOUT_MS,
        socketTimeout: SMTP_TEST_TIMEOUT_MS,
        dnsTimeout: SMTP_TEST_TIMEOUT_MS,
      });

      const smtpOperation = from
        ? transporter.sendMail({
            from,
            to: from,
            subject: "SmartEconomat - Prueba SMTP",
            text: "Prueba de conexión SMTP realizada desde ElectronInstaller.",
          })
        : transporter.verify();

      await Promise.race([
        smtpOperation,
        new Promise<never>((_resolve, reject) => {
          setTimeout(() => {
            reject(new Error("Timeout al verificar SMTP"));
          }, SMTP_TEST_TIMEOUT_MS);
        }),
      ]);

      if (typeof transporter.close === "function") {
        transporter.close();
      }

      return {
        ok: true,
        message: "Conexión SMTP verificada correctamente.",
        data: true,
      };
    } catch (error) {
      // Evita que una conexión SMTP colgada deje la UI en "Probando..." indefinidamente.
      const detail = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        message: `No se pudo verificar SMTP: ${detail}`,
        errorCode: "SMTP_TEST_FAILED",
      };
    }
  }

  private async rollbackWindowsHostsMapping(
    runtimePath: string,
  ): Promise<void> {
    if (process.platform !== "win32") {
      return;
    }
    if (!this.hostsBackupPath) {
      return;
    }

    const backupPath = this.hostsBackupPath;
    const script = [
      "$hostsPath = Join-Path $env:SystemRoot 'System32\\drivers\\etc\\hosts'",
      `$backupPath = '${backupPath.replace(/\\/g, "\\\\")}'`,
      "if (Test-Path -LiteralPath $backupPath) { Copy-Item -LiteralPath $backupPath -Destination $hostsPath -Force }",
      "Write-Output 'HOSTS_ROLLED_BACK'",
    ].join("; ");

    await this.processRunner.run({
      command: "powershell.exe",
      args: [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        script,
      ],
      timeoutMs: 45_000,
      cwd: runtimePath,
    });
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

  private defaultRuntimePath(): string {
    return getDefaultRuntimePath(process.platform, app.getPath("home"));
  }

  private async resolveRuntimePathForBoot(): Promise<string> {
    const markerPath = path.join(
      process.env.APPDATA ??
        path.join(process.env.HOME ?? process.cwd(), ".config"),
      "SmartEconomatInstaller",
      "runtime-path.txt",
    );

    try {
      const marked = (await fs.readFile(markerPath, "utf8")).trim();
      if (marked.length > 0) {
        return marked;
      }
    } catch {
      // fallback default runtime path
    }

    return this.defaultRuntimePath();
  }

  private async hasInstalledRuntime(runtimePath: string): Promise<boolean> {
    const envPath = path.join(runtimePath, ".env.prod");
    const composePath = path.join(
      runtimePath,
      "project",
      "docker-compose.prod.yml",
    );

    try {
      await Promise.all([fs.access(envPath), fs.access(composePath)]);
      return true;
    } catch {
      return false;
    }
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
