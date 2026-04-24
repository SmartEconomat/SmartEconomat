import type {
  BackupMetadata,
  BackupPayload,
  DebugLogEntry,
  ExportVisibleLogsPayload,
  HealthUpdateEvent,
  InstallerBootState,
  InstallerFilePickerPayload,
  InstallerConfigPayload,
  InstallerProgressEvent,
  InstallerStateSnapshot,
  OperationResult,
  PortRepairPayload,
  PreflightReport,
  PrunePayload,
  RestorePayload,
  RuntimeLogEvent,
  RuntimePaths,
  ServiceHealth,
  SupervisorSnapshot,
  TailLogsPayload,
  UninstallPayload,
} from "@shared/contracts";

declare global {
  interface Window {
    smartEconomat: {
      runPreflight: (
        payload: RuntimePaths,
      ) => Promise<OperationResult<PreflightReport>>;
      runPreflightAutoRepair: (
        payload: RuntimePaths,
      ) => Promise<OperationResult<PreflightReport>>;
      releaseBusyPort: (
        payload: PortRepairPayload,
      ) => Promise<OperationResult<PreflightReport>>;
      startInstallation: (
        payload: InstallerConfigPayload,
      ) => Promise<OperationResult<InstallerStateSnapshot>>;
      pickInstallerFile: (
        payload: InstallerFilePickerPayload,
      ) => Promise<OperationResult<string>>;
      testSmtp: (
        config: Partial<InstallerConfigPayload>,
      ) => Promise<OperationResult<boolean>>;
      getInstallerState: () => Promise<OperationResult<InstallerStateSnapshot>>;
      getInstallerBootState: () => Promise<OperationResult<InstallerBootState>>;
      onInstallerProgress: (
        callback: (event: InstallerProgressEvent) => void,
      ) => () => void;
      startStack: (payload: RuntimePaths) => Promise<OperationResult>;
      stopStack: (payload: RuntimePaths) => Promise<OperationResult>;
      restartStack: (payload: RuntimePaths) => Promise<OperationResult>;
      getHealth: (
        payload: RuntimePaths,
      ) => Promise<OperationResult<ServiceHealth[]>>;
      tailLogs: (payload: TailLogsPayload) => Promise<OperationResult>;
      stopLogStream: () => Promise<OperationResult>;
      exportVisibleLogs: (
        payload: ExportVisibleLogsPayload,
      ) => Promise<OperationResult<string>>;
      onRuntimeLog: (callback: (event: RuntimeLogEvent) => void) => () => void;
      pruneSafe: (payload: PrunePayload) => Promise<OperationResult>;
      uninstall: (payload: UninstallPayload) => Promise<OperationResult>;
      backupNow: (
        payload: BackupPayload,
      ) => Promise<OperationResult<BackupMetadata>>;
      restoreFrom: (payload: RestorePayload) => Promise<OperationResult>;
      diagnostics: (payload: RuntimePaths) => Promise<OperationResult<string>>;
      getWatchdogStatus: () => Promise<OperationResult<HealthUpdateEvent>>;
      getSupervisorSnapshot: () => Promise<OperationResult<SupervisorSnapshot>>;
      restartDockerDesktop: () => Promise<OperationResult>;
      runSupervisorRecovery: () => Promise<OperationResult>;
      onHealthUpdate: (
        callback: (event: HealthUpdateEvent) => void,
      ) => () => void;
      onDebugLog: (callback: (event: DebugLogEntry) => void) => () => void;
      getDebugLogs: () => Promise<OperationResult<DebugLogEntry[]>>;
      clearDebugLogs: () => Promise<OperationResult>;
      isDebugModeEnabled: () => Promise<OperationResult<boolean>>;
      sendDebugLog: (entry: DebugLogEntry) => void;
    };
  }
}

export {};
