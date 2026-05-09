import { useEffect, useMemo, useState } from "react";

import type {
  BackupMetadata,
  InstallerFilePickerPayload,
  InstallerConfigPayload,
  InstallerStateSnapshot,
  PreflightReport,
  RuntimeLogEvent,
  ServiceHealth,
} from "@shared/contracts";

/** Alias de tipo público (WizardStep). */
export type WizardStep =
  | "welcome"
  | "preflight"
  | "config"
  | "deploy"
  | "finish"
  | "control";

const defaultConfig: InstallerConfigPayload = {
  runtimePath: `${globalThis.navigator?.platform?.startsWith("Win") ? "C:/SmartEconomatRuntime" : "/tmp/smarteconomat-runtime"}`,
  instanceName: "smarteconomat-local",
  adminUsername: "admin",
  adminPassword: "SmartEconomat2026!",
  superAdminUsername: "superadmin",
  superAdminPassword: "SmartEconomat2026!",
  useSamePasswordForBoth: true,
  localHost: "smarteconomat.app",
  timezone: "Europe/Madrid",
  tlsProvider: "selfsigned",
  customCertFullchainPath: "",
  customCertPrivkeyPath: "",
  backupFrequency: "daily",
  backupRetentionDays: 30,
};

type SmartEconomatBridge = Window["smartEconomat"];

const BRIDGE_UNAVAILABLE_ERROR =
  "No se pudo conectar con el bridge de Electron. Reinicia el instalador.";

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

/**
 * Expone la operación "useInstallerFlow" del instalador SmartEconomat.
 * @returns {{ step: WizardStep; setStep: import("/home/psych/projects/SmartEconomat/ElectronInstaller/node_modules/@types/react/index").Dispatch<import("/home/psych/projects/SmartEconomat/ElectronInstaller/node_modules/@types/react/index").SetStateAction<WizardStep>>; config: InstallerConfigPayload; setConfig: import("/home/psych/projects/SmartEconomat/ElectronInstaller/node_modules/@types/react/index").Dispatch<import("/home/psych/projects/SmartEconomat/ElectronInstaller/node_modules/@types/react/index").SetStateAction<InstallerConfigPayload>>; preflightReport: PreflightReport | null; installerState: InstallerStateSnapshot | null; blockersCount: number; health: ServiceHealth[]; logs: RuntimeLogEvent[]; busy: boolean; error: string | null; setError: import("/home/psych/projects/SmartEconomat/ElectronInstaller/node_modules/@types/react/index").Dispatch<import("/home/psych/projects/SmartEconomat/ElectronInstaller/node_modules/@types/react/index").SetStateAction<string | null>>; lastBackup: BackupMetadata | null; runPreflight: () => Promise<void>; runAutoRepair: () => Promise<void>; closeBusyPort: (port: number) => Promise<void>; startInstallation: () => Promise<void>; refreshHealth: () => Promise<void>; startStack: () => Promise<void>; stopStack: () => Promise<void>; restartStack: () => Promise<void>; tailLogs: (service: "frontend" | "backend" | "db" | "redis") => Promise<void>; stopLogs: () => Promise<void>; clearVisibleLogs: () => void; exportVisibleLogs: () => Promise<void>; prune: (level: "safe" | "aggressive", confirmationPhrase: string) => Promise<void>; backupNow: (label: string) => Promise<void>; restoreFrom: (artifactPath: string) => Promise<void>; pickRestoreArtifact: () => Promise<string | null>; generateDiagnostics: () => Promise<void>; pickInstallerFile: (payload: InstallerFilePickerPayload) => Promise<string | null>; }} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function useInstallerFlow() {
  const [step, setStep] = useState<WizardStep>("welcome");
  const [config, setConfig] = useState<InstallerConfigPayload>(defaultConfig);
  const [preflightReport, setPreflightReport] =
    useState<PreflightReport | null>(null);
  const [installerState, setInstallerState] =
    useState<InstallerStateSnapshot | null>(null);
  const [health, setHealth] = useState<ServiceHealth[]>([]);
  const [logs, setLogs] = useState<RuntimeLogEvent[]>([]);
  const [lastBackup, setLastBackup] = useState<BackupMetadata | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let stopInstallerProgress: (() => void) | null = null;
    let stopRuntimeLog: (() => void) | null = null;

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

      stopInstallerProgress = bridge.onInstallerProgress((event) => {
        setInstallerState(event.snapshot);
      });

      stopRuntimeLog = bridge.onRuntimeLog((event) => {
        setLogs((previous) => [...previous.slice(-499), event]);
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

    const bridge = requireBridge(true);
    if (!bridge) {
      return;
    }

    const result = await bridge.runPreflight({
      runtimePath: config.runtimePath,
    });
    setBusy(false);

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
  }

  async function runAutoRepair(): Promise<void> {
    setBusy(true);
    setError(null);

    const bridge = requireBridge(true);
    if (!bridge) {
      return;
    }

    const result = await bridge.runPreflightAutoRepair({
      runtimePath: config.runtimePath,
    });
    setBusy(false);

    if (result.data) {
      setPreflightReport(result.data);
    }

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setError(null);
  }

  async function closeBusyPort(port: number): Promise<void> {
    setBusy(true);
    setError(null);

    const bridge = requireBridge(true);
    if (!bridge) {
      return;
    }

    const result = await bridge.releaseBusyPort({
      runtimePath: config.runtimePath,
      port,
    });
    setBusy(false);

    if (result.data) {
      setPreflightReport(result.data);
    }

    if (!result.ok) {
      setError(result.message);
      return;
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

    const result = await bridge.startInstallation(config);
    setBusy(false);

    if (!result.ok || !result.data) {
      setError(result.message);
      return;
    }

    setInstallerState(result.data);
    setStep("finish");
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

  async function backupNow(label: string): Promise<void> {
    setBusy(true);
    setError(null);

    const bridge = requireBridge(true);
    if (!bridge) {
      return;
    }

    const result = await bridge.backupNow({
      runtimePath: config.runtimePath,
      label: label.trim().length > 0 ? label.trim() : "manual",
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
      defaultPath: `${config.runtimePath}/backups`,
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
    logs,
    busy,
    error,
    setError,
    lastBackup,
    runPreflight,
    runAutoRepair,
    closeBusyPort,
    startInstallation,
    refreshHealth,
    startStack,
    stopStack,
    restartStack,
    tailLogs,
    stopLogs,
    clearVisibleLogs,
    exportVisibleLogs,
    prune,
    backupNow,
    restoreFrom,
    pickRestoreArtifact,
    generateDiagnostics,
    pickInstallerFile,
  };
}
