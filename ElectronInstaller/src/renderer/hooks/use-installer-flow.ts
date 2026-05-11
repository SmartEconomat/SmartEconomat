import { useEffect, useMemo, useState } from "react";

import type {
  BackupMetadata,
  HealthUpdateEvent,
  InstallerFilePickerPayload,
  InstallerConfigPayload,
  InstallerStateSnapshot,
  PreflightReport,
  RuntimeLogEvent,
  ServiceHealth,
  SupervisorSnapshot,
  WatchdogStatus,
} from "@shared/contracts";
import { getDefaultRuntimePath } from "@shared/default-runtime-path";

export type WizardStep =
  | "welcome"
  | "preflight"
  | "config"
  | "smtp"
  | "deploy"
  | "finish"
  | "control";

const defaultRuntimePath = getDefaultRuntimePath(
  typeof process !== "undefined" ? process.platform : "linux",
  typeof process !== "undefined" && typeof process.env.HOME === "string"
    ? process.env.HOME
    : "",
);

const defaultConfig: InstallerConfigPayload = {
  runtimePath: defaultRuntimePath,
  instanceName: "smarteconomat-local",
  installMode: "new",
  adminUsername: "admin",
  adminPassword: "SmartEconomat2026!",
  superAdminUsername: "superadmin",
  superAdminPassword: "SmartEconomat2026!",
  verifyExistingAdminSession: false,
  repairAdminCredentialsOnFailure: false,
  verifyAdminUsername: "",
  verifyAdminPassword: "",
  useSamePasswordForBoth: true,
  localHost: "smarteconomat.app",
  timezone: "Europe/Madrid",
  tlsProvider: "selfsigned",
  customCertFullchainPath: "",
  customCertPrivkeyPath: "",
  backupDefaultDirectory: resolveRuntimeBackupDirectory(defaultRuntimePath),
  backupFrequency: "daily",
  backupScheduleTime: "02:00",
  backupRetentionDays: 30,
  postgresUser: "",
  postgresDb: "",
  jwtExpiration: "7d",
  i18nPath: "",
  i18nFallbackLanguage: "es",
  sentryDsn: "",
  viteSentryDsn: "",
  startupRunMigrations: true,
  httpPort: 80,
  httpsPort: 443,
  smtpHost: "",
  smtpPort: "",
  smtpUser: "",
  smtpPass: "",
  smtpFrom: "",
  smtpSecure: false,
};

type SmartEconomatBridge = Window["smartEconomat"];

const BRIDGE_UNAVAILABLE_ERROR =
  "No se pudo conectar con el bridge de Electron. Reinicia el instalador.";
const BACKUP_DEFAULT_DIR_STORAGE_KEY = "installer.backupDefaultDirectory";
const INSTALL_TIMEOUT_MS = 12 * 60 * 1000;

function normalizeHealthForComparison(health: ServiceHealth[]): string {
  return JSON.stringify(
    health
      .map((service) => ({
        service: service.service,
        status: service.status,
        detail: service.detail,
      }))
      .sort((a, b) => a.service.localeCompare(b.service)),
  );
}

function normalizeWatchdogForComparison(
  watchdog: WatchdogStatus | null,
): string {
  if (!watchdog) {
    return "";
  }

  return JSON.stringify({
    state: watchdog.state,
    consecutiveFailures: watchdog.consecutiveFailures,
    currentRecoveryLevel: watchdog.currentRecoveryLevel,
    nextCheckInMs: watchdog.nextCheckInMs,
    dockerState: watchdog.dockerStatus?.state,
    dockerDetail: watchdog.dockerStatus?.detail,
  });
}

function normalizeSupervisorForComparison(
  snapshot: SupervisorSnapshot | null,
): string {
  if (!snapshot) {
    return "";
  }

  return JSON.stringify({
    overallState: snapshot.overallState,
    lastAutomaticActionAt: snapshot.lastAutomaticActionAt,
    lastAutomaticAction: snapshot.lastAutomaticAction,
    incidentsOpen: snapshot.incidentsOpen,
    incidentsResolved: snapshot.incidentsResolved,
    checks: snapshot.checks.map((check) => ({
      id: check.id,
      state: check.state,
      detail: check.detail,
    })),
    latestIncident: snapshot.latestIncident
      ? {
          id: snapshot.latestIncident.id,
          state: snapshot.latestIncident.state,
          detail: snapshot.latestIncident.detail,
        }
      : null,
  });
}

function resolveRuntimeBackupDirectory(runtimePath: string): string {
  return `${runtimePath}/backups`;
}

function readPersistedBackupDirectory(runtimePath: string): string {
  if (typeof window === "undefined") {
    return resolveRuntimeBackupDirectory(runtimePath);
  }

  const stored = window.localStorage.getItem(BACKUP_DEFAULT_DIR_STORAGE_KEY);
  if (!stored || stored.trim().length === 0) {
    return resolveRuntimeBackupDirectory(runtimePath);
  }

  return stored;
}

function resolveSmartEconomatBridge(
  targetWindow?: Window,
): SmartEconomatBridge | null {
  const sourceWindow =
    targetWindow ?? (typeof window === "undefined" ? undefined : window);

  if (!sourceWindow) {
    return null;
  }

  const maybeBridge = (sourceWindow as Partial<Window>).smartEconomat;
  return maybeBridge ?? null;
}

function shouldOpenControlPanelFromHash(targetWindow?: Window): boolean {
  const sourceWindow =
    targetWindow ?? (typeof window === "undefined" ? undefined : window);

  if (!sourceWindow) {
    return false;
  }

  return sourceWindow.location.hash.toLowerCase().includes("/control");
}

export function useInstallerFlow() {
  const [step, setStep] = useState<WizardStep>("welcome");
  const [config, setConfig] = useState<InstallerConfigPayload>(defaultConfig);
  const [preflightReport, setPreflightReport] =
    useState<PreflightReport | null>(null);
  const [installerState, setInstallerState] =
    useState<InstallerStateSnapshot | null>(null);
  const [health, setHealth] = useState<ServiceHealth[]>([]);
  const [watchdogStatus, setWatchdogStatus] = useState<WatchdogStatus | null>(
    null,
  );
  const [supervisorSnapshot, setSupervisorSnapshot] =
    useState<SupervisorSnapshot | null>(null);
  const [logs, setLogs] = useState<RuntimeLogEvent[]>([]);
  const [lastBackup, setLastBackup] = useState<BackupMetadata | null>(null);
  const [backupDefaultDirectory, setBackupDefaultDirectoryState] = useState(
    () => readPersistedBackupDirectory(defaultConfig.runtimePath),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function hydrateBootState(bridge: SmartEconomatBridge): Promise<void> {
    const result = await bridge.getInstallerBootState();
    if (!result.ok || !result.data) {
      return;
    }

    const nextRuntimePath = result.data.runtimePath.trim();
    if (nextRuntimePath.length > 0) {
      setConfig((current) => {
        if (current.runtimePath === nextRuntimePath) {
          return current;
        }

        return {
          ...current,
          runtimePath: nextRuntimePath,
          backupDefaultDirectory:
            resolveRuntimeBackupDirectory(nextRuntimePath),
        };
      });
    }

    if (result.data.installed) {
      setConfig((current) =>
        current.installMode === "reinstall"
          ? current
          : {
              ...current,
              installMode: "reinstall",
            },
      );
    }

    if (shouldOpenControlPanelFromHash()) {
      setStep("control");
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(BACKUP_DEFAULT_DIR_STORAGE_KEY);
    const resolvedBackupDirectory =
      stored && stored.trim().length > 0
        ? stored.trim()
        : resolveRuntimeBackupDirectory(config.runtimePath);

    setBackupDefaultDirectoryState(resolvedBackupDirectory);
    setConfig((current) =>
      current.backupDefaultDirectory === resolvedBackupDirectory
        ? current
        : {
            ...current,
            backupDefaultDirectory: resolvedBackupDirectory,
          },
    );
  }, [config.runtimePath]);

  useEffect(() => {
    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let stopInstallerProgress: (() => void) | null = null;
    let stopRuntimeLog: (() => void) | null = null;
    let stopHealthUpdate: (() => void) | null = null;

    const maxAttempts = 20;
    const retryDelayMs = 120;

    const attachBridge = (attempt: number) => {
      if (disposed) {
        return;
      }

      const bridge = resolveSmartEconomatBridge();
      if (!bridge) {
        if (attempt < maxAttempts) {
          retryTimer = setTimeout(() => {
            attachBridge(attempt + 1);
          }, retryDelayMs);
          return;
        }

        setError((current) => current ?? BRIDGE_UNAVAILABLE_ERROR);
        return;
      }

      setError((current) =>
        current === BRIDGE_UNAVAILABLE_ERROR ? null : current,
      );

      void hydrateBootState(bridge);

      stopInstallerProgress = bridge.onInstallerProgress((event) => {
        setInstallerState(event.snapshot);
      });

      stopRuntimeLog = bridge.onRuntimeLog((event) => {
        setLogs((previous) => [...previous.slice(-499), event]);
      });

      stopHealthUpdate = bridge.onHealthUpdate((event: HealthUpdateEvent) => {
        setHealth((previous) =>
          normalizeHealthForComparison(previous) ===
          normalizeHealthForComparison(event.health)
            ? previous
            : event.health,
        );
        setWatchdogStatus((previous) =>
          normalizeWatchdogForComparison(previous) ===
          normalizeWatchdogForComparison(event.watchdog)
            ? previous
            : event.watchdog,
        );
        if (event.supervisorSnapshot) {
          setSupervisorSnapshot((previous) =>
            normalizeSupervisorForComparison(previous) ===
            normalizeSupervisorForComparison(event.supervisorSnapshot ?? null)
              ? previous
              : (event.supervisorSnapshot ?? previous),
          );
        }
      });
    };

    attachBridge(0);

    return () => {
      disposed = true;

      if (retryTimer) {
        clearTimeout(retryTimer);
      }

      stopInstallerProgress?.();
      stopRuntimeLog?.();
      stopHealthUpdate?.();
    };
  }, []);

  const blockersCount = useMemo(() => {
    if (!preflightReport) {
      return 0;
    }
    return preflightReport.checks.filter((check) => check.status === "BLOCKER")
      .length;
  }, [preflightReport]);

  function requireBridge(
    resetBusyOnMissing = false,
  ): SmartEconomatBridge | null {
    const bridge = resolveSmartEconomatBridge();
    if (bridge) {
      return bridge;
    }

    setError(BRIDGE_UNAVAILABLE_ERROR);
    if (resetBusyOnMissing) {
      setBusy(false);
    }

    return null;
  }

  async function runPreflight(): Promise<void> {
    setBusy(true);
    setError(null);
    setLogs([]);

    const bridge = requireBridge(true);
    if (!bridge) {
      return;
    }

    try {
      const result = await bridge.runPreflight({
        runtimePath: config.runtimePath,
      });

      if (result.data) {
        setPreflightReport(result.data);
      }

      if (!result.ok) {
        if (!result.data) {
          setError(result.message);
          return;
        }

        const blockers = result.data.checks.filter(
          (check) => check.status === "BLOCKER",
        );

        if (blockers.length === 0) {
          setError(result.message);
          return;
        }

        const summarizedBlockers = blockers
          .slice(0, 3)
          .map((check) => `${check.label}: ${check.detail}`)
          .join(" | ");
        const extraInfo = blockers.length > 3 ? " | ..." : "";

        setError(
          `Preflight con bloqueantes (${blockers.length}). ${summarizedBlockers}${extraInfo}`,
        );
        return;
      }

      if (!result.data) {
        setError(result.message);
        return;
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error inesperado al ejecutar preflight.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function runAutoRepair(): Promise<void> {
    setBusy(true);
    setError(null);
    setLogs([]);

    const bridge = requireBridge(true);
    if (!bridge) {
      return;
    }

    try {
      const result = await bridge.runPreflightAutoRepair({
        runtimePath: config.runtimePath,
      });

      if (result.data) {
        setPreflightReport(result.data);
      }

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error inesperado al ejecutar autorreparación de preflight.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function closeBusyPort(port: number): Promise<void> {
    setBusy(true);
    setError(null);

    const bridge = requireBridge(true);
    if (!bridge) {
      return;
    }

    try {
      const result = await bridge.releaseBusyPort({
        runtimePath: config.runtimePath,
        port,
      });

      if (result.data) {
        setPreflightReport(result.data);
      }

      if (!result.ok) {
        setError(result.message);
        return;
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error inesperado al cerrar el proceso del puerto.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function startInstallation(): Promise<void> {
    setBusy(true);
    setError(null);
    setLogs([]);

    const bridge = requireBridge(true);
    if (!bridge) {
      return;
    }

    try {
      const result = (await Promise.race([
        bridge.startInstallation(config),
        new Promise<never>((_resolve, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                "La instalación tardó demasiado. Puedes reintentar sin cerrar la aplicación.",
              ),
            );
          }, INSTALL_TIMEOUT_MS);
        }),
      ])) as Awaited<ReturnType<SmartEconomatBridge["startInstallation"]>>;

      if (!result.ok || !result.data) {
        setError(result.message);
        return;
      }

      setInstallerState(result.data);
      setStep("finish");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error inesperado al iniciar la instalación.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function refreshHealth(): Promise<void> {
    const bridge = requireBridge();
    if (!bridge) {
      return;
    }

    const result = await bridge.getHealth({
      runtimePath: config.runtimePath,
    });
    if (result.ok && result.data) {
      setHealth(result.data);
    }
    const snapshotResult = await bridge.getSupervisorSnapshot();
    if (snapshotResult.ok && snapshotResult.data) {
      setSupervisorSnapshot(snapshotResult.data);
    }
  }

  async function restartDockerDesktop(): Promise<void> {
    setBusy(true);
    setError(null);
    const bridge = requireBridge(true);
    if (!bridge) {
      return;
    }
    const result = await bridge.restartDockerDesktop();
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await refreshHealth();
  }

  async function runSupervisorRecovery(): Promise<void> {
    setBusy(true);
    setError(null);
    const bridge = requireBridge(true);
    if (!bridge) {
      return;
    }
    const result = await bridge.runSupervisorRecovery();
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await refreshHealth();
  }

  async function startStack(): Promise<void> {
    setBusy(true);
    setError(null);

    const bridge = requireBridge(true);
    if (!bridge) {
      return;
    }

    const result = await bridge.startStack({
      runtimePath: config.runtimePath,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await refreshHealth();
  }

  async function stopStack(): Promise<void> {
    setBusy(true);
    setError(null);

    const bridge = requireBridge(true);
    if (!bridge) {
      return;
    }

    const result = await bridge.stopStack({
      runtimePath: config.runtimePath,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await refreshHealth();
  }

  async function restartStack(): Promise<void> {
    setBusy(true);
    setError(null);

    const bridge = requireBridge(true);
    if (!bridge) {
      return;
    }

    const result = await bridge.restartStack({
      runtimePath: config.runtimePath,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await refreshHealth();
  }

  async function tailLogs(
    service: "frontend" | "backend" | "db" | "redis",
  ): Promise<void> {
    setError(null);

    const bridge = requireBridge();
    if (!bridge) {
      return;
    }

    const result = await bridge.tailLogs({
      runtimePath: config.runtimePath,
      service,
      lines: 200,
    });
    if (!result.ok) {
      setError(result.message);
    }
  }

  async function stopLogs(): Promise<void> {
    const bridge = requireBridge();
    if (!bridge) {
      return;
    }

    await bridge.stopLogStream();
  }

  function clearVisibleLogs(): void {
    setLogs([]);
  }

  async function exportVisibleLogs(): Promise<void> {
    if (logs.length === 0) {
      return;
    }

    setBusy(true);
    setError(null);

    const bridge = requireBridge(true);
    if (!bridge) {
      return;
    }

    const result = await bridge.exportVisibleLogs({
      runtimePath: config.runtimePath,
      logs,
    });
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
    }
  }

  async function prune(
    level: "safe" | "aggressive",
    confirmationPhrase: string,
  ): Promise<void> {
    setBusy(true);
    setError(null);

    const bridge = requireBridge(true);
    if (!bridge) {
      return;
    }

    const result = await bridge.pruneSafe({
      runtimePath: config.runtimePath,
      level,
      confirmationPhrase,
    });
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
    }
  }

  async function uninstall(confirmationPhrase: string): Promise<void> {
    setBusy(true);
    setError(null);

    const bridge = requireBridge(true);
    if (!bridge) {
      return;
    }

    const result = await bridge.uninstall({
      runtimePath: config.runtimePath,
      confirmationPhrase,
    });
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
    }
  }

  function setBackupDefaultDirectory(directory: string): void {
    const normalizedDirectory = directory.trim();
    setBackupDefaultDirectoryState(normalizedDirectory);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        BACKUP_DEFAULT_DIR_STORAGE_KEY,
        normalizedDirectory,
      );
    }
  }

  async function backupNow(
    label: string,
    destinationDir: string,
  ): Promise<void> {
    setBusy(true);
    setError(null);

    const bridge = requireBridge(true);
    if (!bridge) {
      return;
    }

    const result = await bridge.backupNow({
      runtimePath: config.runtimePath,
      label: label.trim().length > 0 ? label.trim() : "manual",
      destinationDir,
    });
    setBusy(false);

    if (!result.ok || !result.data) {
      setError(result.message);
      return;
    }

    setLastBackup(result.data);
  }

  async function restoreFrom(artifactPath: string): Promise<void> {
    setBusy(true);
    setError(null);

    const bridge = requireBridge(true);
    if (!bridge) {
      return;
    }

    const result = await bridge.restoreFrom({
      runtimePath: config.runtimePath,
      artifactPath,
      confirmationPhrase: "CONFIRMAR",
    });
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    await refreshHealth();
  }

  async function pickRestoreArtifact(): Promise<string | null> {
    return pickInstallerFile({
      title: "Seleccionar backup para restaurar",
      buttonLabel: "Usar este backup",
      defaultPath: backupDefaultDirectory,
      filters: [
        {
          name: "Backups SmartEconomat",
          extensions: ["zip", "gz", "tgz"],
        },
        {
          name: "Todos los archivos",
          extensions: ["*"],
        },
      ],
    });
  }

  async function pickBackupDirectory(
    defaultPath?: string,
  ): Promise<string | null> {
    return pickInstallerFile({
      title: "Seleccionar carpeta de backups",
      buttonLabel: "Usar esta carpeta",
      defaultPath: defaultPath ?? backupDefaultDirectory,
      pickDirectories: true,
    });
  }

  async function generateDiagnostics(): Promise<void> {
    setBusy(true);
    setError(null);

    const bridge = requireBridge(true);
    if (!bridge) {
      return;
    }

    const result = await bridge.diagnostics({
      runtimePath: config.runtimePath,
    });
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    if (result.data) {
      setError(`Diagnóstico generado: ${result.data}`);
    }
  }

  async function pickInstallerFile(
    payload: InstallerFilePickerPayload,
  ): Promise<string | null> {
    const bridge = requireBridge();
    if (!bridge) {
      return null;
    }

    const result = await bridge.pickInstallerFile(payload);
    if (!result.ok) {
      setError(result.message);
      return null;
    }

    if (!result.data || result.data.trim().length === 0) {
      return null;
    }

    return result.data;
  }

  return {
    step,
    setStep,
    config,
    setConfig,
    preflightReport,
    installerState,
    blockersCount,
    health,
    watchdogStatus,
    supervisorSnapshot,
    logs,
    busy,
    error,
    setError,
    lastBackup,
    backupDefaultDirectory,
    setBackupDefaultDirectory,
    runPreflight,
    runAutoRepair,
    closeBusyPort,
    startInstallation,
    refreshHealth,
    restartDockerDesktop,
    runSupervisorRecovery,
    startStack,
    stopStack,
    restartStack,
    tailLogs,
    stopLogs,
    clearVisibleLogs,
    exportVisibleLogs,
    prune,
    uninstall,
    backupNow,
    restoreFrom,
    pickBackupDirectory,
    pickRestoreArtifact,
    generateDiagnostics,
    pickInstallerFile,
  };
}
