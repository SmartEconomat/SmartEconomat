/**
 * Mock de `window.smartEconomat` para capturas E2E (preload capture) y referencia
 * alineada con `test/e2e/fixtures/installer-bridge.mock.js` (Playwright web).
 */
import type {
  BackupMetadata,
  DebugLogEntry,
  HealthUpdateEvent,
  InstallerBootState,
  InstallerFilePickerPayload,
  InstallerProgressEvent,
  InstallerStateSnapshot,
  OperationResult,
  PreflightReport,
  ServiceHealth,
  SupervisorSnapshot,
  TailLogsPayload,
} from "./contracts";

export type InstallerBridgeCallCounts = {
  runPreflight: number;
  startInstallation: number;
  startStack: number;
  stopStack: number;
  restartStack: number;
  getHealth: number;
  tailLogs: number;
  stopLogStream: number;
  exportVisibleLogs: number;
  pruneSafe: number;
  backupNow: number;
  restoreFrom: number;
  diagnostics: number;
  pickInstallerFile: number;
  testSmtp: number;
  uninstall: number;
  restartDockerDesktop: number;
  runSupervisorRecovery: number;
};

type MockBridgeFlags = Record<string, string | number | boolean | undefined>;

type InstallerProgressListener = (event: InstallerProgressEvent) => void;
type RuntimeLogListener = (event: {
  service: string;
  line: string;
  timestamp: string;
}) => void;

export function createInstallerCaptureBridgeMock(): Record<string, unknown> {
  const installerProgressListeners: InstallerProgressListener[] = [];
  const runtimeLogListeners: RuntimeLogListener[] = [];

  const bridgeCalls: InstallerBridgeCallCounts = {
    runPreflight: 0,
    startInstallation: 0,
    startStack: 0,
    stopStack: 0,
    restartStack: 0,
    getHealth: 0,
    tailLogs: 0,
    stopLogStream: 0,
    exportVisibleLogs: 0,
    pruneSafe: 0,
    backupNow: 0,
    restoreFrom: 0,
    diagnostics: 0,
    pickInstallerFile: 0,
    testSmtp: 0,
    uninstall: 0,
    restartDockerDesktop: 0,
    runSupervisorRecovery: 0,
  };

  const mockBridgeFlags: MockBridgeFlags = {
    installFailMessage: "",
  };

  const preflightReport: PreflightReport = {
    generatedAt: new Date().toISOString(),
    checks: [
      {
        id: "docker-engine",
        label: "Docker Engine",
        status: "OK",
        detail: "Docker operativo en entorno de prueba E2E.",
      },
      {
        id: "docker-compose",
        label: "Docker Compose",
        status: "OK",
        detail: "Compose operativo en entorno de prueba E2E.",
      },
    ],
  };

  const healthyServices: ServiceHealth[] = [
    {
      service: "backend",
      status: "healthy",
      detail: "API lista para recibir peticiones.",
    },
    {
      service: "frontend",
      status: "healthy",
      detail: "UI y proxy HTTPS operativos.",
    },
    {
      service: "db",
      status: "running",
      detail: "PostgreSQL en ejecución (mock capturas).",
    },
    {
      service: "redis",
      status: "healthy",
      detail: "Redis operativo (mock capturas).",
    },
  ];

  return {
    setCaptureMockFlags: async (
      flags: Record<string, string | number | boolean>,
    ): Promise<OperationResult> => {
      for (const [key, value] of Object.entries(flags)) {
        mockBridgeFlags[key] = value;
      }
      return { ok: true, message: "Flags de mock actualizadas" };
    },

    runPreflight: async (): Promise<OperationResult<PreflightReport>> => {
      bridgeCalls.runPreflight += 1;
      return {
        ok: true,
        message: "Preflight OK",
        data: preflightReport,
      };
    },

    runPreflightAutoRepair: async (): Promise<
      OperationResult<PreflightReport>
    > => ({
      ok: true,
      message: "AutoRepair OK",
      data: preflightReport,
    }),

    testSmtp: async (): Promise<OperationResult<boolean>> => {
      bridgeCalls.testSmtp += 1;
      return {
        ok: true,
        message: "Mocked SMTP",
        data: true,
      };
    },

    releaseBusyPort: async (): Promise<OperationResult<PreflightReport>> => ({
      ok: true,
      message: "Puerto liberado",
      data: preflightReport,
    }),

    startInstallation: async (): Promise<
      OperationResult<InstallerStateSnapshot>
    > => {
      bridgeCalls.startInstallation += 1;

      const failMessage = String(
        mockBridgeFlags.installFailMessage ?? "",
      ).trim();
      if (failMessage.length > 0) {
        return {
          ok: false,
          message: failMessage,
        };
      }

      const inProgressSnapshot: InstallerStateSnapshot = {
        state: "DOCKER_DEPLOY",
        timestamp: new Date().toISOString(),
        message: "Desplegando servicios del stack.",
        stageLabel: "Desplegando",
        progressPercent: 55,
      };

      installerProgressListeners.forEach((callback) => {
        callback({ snapshot: inProgressSnapshot });
      });
      await new Promise((resolve) => setTimeout(resolve, 900));

      const snapshot: InstallerStateSnapshot = {
        state: "DONE",
        timestamp: new Date().toISOString(),
        message: "Instalación completada en entorno de prueba.",
        stageLabel: "Finalizado",
        progressPercent: 100,
      };

      installerProgressListeners.forEach((callback) => {
        callback({ snapshot });
      });

      return {
        ok: true,
        message: "Instalación finalizada",
        data: snapshot,
      };
    },

    pickInstallerFile: async (
      payload: InstallerFilePickerPayload,
    ): Promise<OperationResult<string>> => {
      bridgeCalls.pickInstallerFile += 1;
      const isBackupPicker = String(payload.title || "")
        .toLowerCase()
        .includes("backup");
      return {
        ok: true,
        message: "Archivo seleccionado",
        data: isBackupPicker
          ? "C:/SmartEconomatRuntime/backups/backup-e2e.tar.gz"
          : "C:/SmartEconomatRuntime/certs/fullchain.pem",
      };
    },

    getInstallerState: async (): Promise<
      OperationResult<InstallerStateSnapshot>
    > => ({
      ok: true,
      message: "Estado disponible",
      data: {
        state: "IDLE",
        timestamp: new Date().toISOString(),
        message: "Sin actividad",
      },
    }),

    getInstallerBootState: async (): Promise<
      OperationResult<InstallerBootState>
    > => ({
      ok: true,
      message: "Sin instalación previa",
      data: {
        installed: false,
        runtimePath: "C:/SmartEconomatRuntime",
      },
    }),

    onInstallerProgress: (
      callback: InstallerProgressListener,
    ): (() => void) => {
      installerProgressListeners.push(callback);
      return () => {
        const idx = installerProgressListeners.indexOf(callback);
        if (idx >= 0) {
          installerProgressListeners.splice(idx, 1);
        }
      };
    },

    startStack: async (): Promise<OperationResult> => {
      bridgeCalls.startStack += 1;
      return { ok: true, message: "Stack iniciado" };
    },

    stopStack: async (): Promise<OperationResult> => {
      bridgeCalls.stopStack += 1;
      return { ok: true, message: "Stack detenido" };
    },

    restartStack: async (): Promise<OperationResult> => {
      bridgeCalls.restartStack += 1;
      return { ok: true, message: "Stack reiniciado" };
    },

    getHealth: async (): Promise<OperationResult<ServiceHealth[]>> => {
      bridgeCalls.getHealth += 1;
      return {
        ok: true,
        message: "Health OK",
        data: healthyServices,
      };
    },

    tailLogs: async (payload: TailLogsPayload): Promise<OperationResult> => {
      bridgeCalls.tailLogs += 1;
      runtimeLogListeners.forEach((callback) => {
        callback({
          service: payload.service,
          line: `Log de ${payload.service} en prueba E2E.`,
          timestamp: new Date().toISOString(),
        });
      });
      return { ok: true, message: "Stream de logs activo" };
    },

    stopLogStream: async (): Promise<OperationResult> => {
      bridgeCalls.stopLogStream += 1;
      return { ok: true, message: "Stream detenido" };
    },

    exportVisibleLogs: async (): Promise<OperationResult<string>> => {
      bridgeCalls.exportVisibleLogs += 1;
      return {
        ok: true,
        message: "Logs exportados",
        data: "C:/SmartEconomatRuntime/logs/smarteconomat-logs-e2e.txt",
      };
    },

    onRuntimeLog: (callback: RuntimeLogListener): (() => void) => {
      runtimeLogListeners.push(callback);
      return () => {
        const idx = runtimeLogListeners.indexOf(callback);
        if (idx >= 0) {
          runtimeLogListeners.splice(idx, 1);
        }
      };
    },

    pruneSafe: async (): Promise<OperationResult> => {
      bridgeCalls.pruneSafe += 1;
      return { ok: true, message: "Limpieza ejecutada" };
    },

    uninstall: async (): Promise<OperationResult> => {
      bridgeCalls.uninstall += 1;
      return { ok: true, message: "Desinstalación completada" };
    },

    backupNow: async (): Promise<OperationResult<BackupMetadata>> => {
      bridgeCalls.backupNow += 1;
      return {
        ok: true,
        message: "Backup generado",
        data: {
          appVersion: "1.0.0",
          schemaVersion: "v1",
          createdAt: new Date().toISOString(),
          checksum: "checksum-e2e",
          archiveName: "backup-e2e.tar.gz",
        },
      };
    },

    restoreFrom: async (): Promise<OperationResult> => {
      bridgeCalls.restoreFrom += 1;
      return {
        ok: true,
        message: "Restore completado",
      };
    },

    diagnostics: async (): Promise<OperationResult<string>> => {
      bridgeCalls.diagnostics += 1;
      return {
        ok: true,
        message: "Diagnóstico generado",
        data: "C:/SmartEconomatRuntime/diagnostics/diag-e2e.zip",
      };
    },

    onDebugLog: (): (() => void) => (): void => undefined,

    getDebugLogs: async (): Promise<OperationResult<DebugLogEntry[]>> => ({
      ok: true,
      message: "Sin logs de debug",
      data: [],
    }),

    clearDebugLogs: async (): Promise<OperationResult> => ({
      ok: true,
      message: "Buffer de debug limpiado",
    }),

    isDebugModeEnabled: async (): Promise<OperationResult<boolean>> => ({
      ok: true,
      message: "Debug desactivado",
      data: false,
    }),

    sendDebugLog: (): void => undefined,

    getWatchdogStatus: async (): Promise<
      OperationResult<HealthUpdateEvent>
    > => ({
      ok: true,
      message: "Watchdog status",
      data: {
        health: [],
        watchdog: {
          state: "idle",
          consecutiveFailures: 0,
          currentRecoveryLevel: 1,
          nextCheckInMs: 0,
          lastCheck: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      },
    }),

    getSupervisorSnapshot: async (): Promise<
      OperationResult<SupervisorSnapshot>
    > => ({
      ok: true,
      message: "Supervisor snapshot",
      data: {
        overallState: "healthy",
        checks: [],
        lastAutomaticActionAt: null,
        lastAutomaticAction: null,
        uptimeSeconds: 120,
      },
    }),

    restartDockerDesktop: async (): Promise<OperationResult> => {
      bridgeCalls.restartDockerDesktop += 1;
      return {
        ok: true,
        message: "Docker reiniciado",
      };
    },

    runSupervisorRecovery: async (): Promise<OperationResult> => {
      bridgeCalls.runSupervisorRecovery += 1;
      return {
        ok: true,
        message: "Recuperación ejecutada",
      };
    },

    onHealthUpdate: (): (() => void) => (): void => undefined,
  };
}
