/** Alias de tipo público (CheckStatus). */
export type CheckStatus = "OK" | "WARN" | "BLOCKER";

/** Contrato tipado público (PreflightCheck). */
export interface PreflightCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  recommendation?: string;
  repairable?: boolean;
  repairAction?: "auto-repair" | "release-port" | "open-security";
  repairHint?: string;
  metadata?: {
    port?: number;
    ownerPid?: number;
    ownerProcessName?: string;
  };
}

/** Contrato tipado público (PreflightReport). */
export interface PreflightReport {
  generatedAt: string;
  checks: PreflightCheck[];
}

/** Contrato tipado público (InstallerConfigPayload). */
export interface InstallerConfigPayload {
  runtimePath: string;
  instanceName: string;
  adminUsername: string;
  adminPassword: string;
  superAdminUsername: string;
  superAdminPassword: string;
  useSamePasswordForBoth: boolean;
  localHost: string;
  timezone: string;
  tlsProvider: "selfsigned" | "none" | "custom";
  customCertFullchainPath?: string;
  customCertPrivkeyPath?: string;
  backupFrequency: "off" | "daily" | "weekly";
  backupRetentionDays: number;
  postgresPassword?: string;
  redisPassword?: string;
  jwtSecret?: string;
}

/** Contrato tipado público (InstallerFilePickerPayload). */
export interface InstallerFilePickerPayload {
  title: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
}

/** Alias de tipo público (InstallerStep). */
export type InstallerStep =
  | "IDLE"
  | "PREFLIGHT"
  | "CONFIG_VALIDATION"
  | "ENV_RENDER"
  | "TLS_SETUP"
  | "DOCKER_DEPLOY"
  | "INITIALIZE_APP"
  | "VERIFY"
  | "DONE"
  | "FAILED";

/** Contrato tipado público (InstallerStateSnapshot). */
export interface InstallerStateSnapshot {
  state: InstallerStep;
  timestamp: string;
  message: string;
  stageLabel?: string;
  progressPercent?: number;
  errorCode?: string;
}

/** Contrato tipado público (InstallJournalEntry). */
export interface InstallJournalEntry extends InstallerStateSnapshot {
  context?: Record<string, string | number | boolean>;
}

/** Contrato tipado público (ServiceHealth). */
export interface ServiceHealth {
  service: "frontend" | "backend" | "db" | "redis";
  status: "healthy" | "running" | "unhealthy" | "starting" | "unknown";
  detail: string;
}

/** Contrato tipado público (CommandResult). */
export interface CommandResult {
  ok: boolean;
  code: number;
  stdout: string;
  stderr: string;
  message: string;
}

/** Contrato tipado público (BackupMetadata). */
export interface BackupMetadata {
  appVersion: string;
  schemaVersion: string;
  createdAt: string;
  checksum: string;
  archiveName: string;
}

/** Contrato tipado público (OperationResult). */
export interface OperationResult<T = undefined> {
  ok: boolean;
  message: string;
  data?: T;
  errorCode?: string;
}

/** Contrato tipado público (RuntimePaths). */
export interface RuntimePaths {
  runtimePath: string;
}

/** Contrato tipado público (PortRepairPayload). */
export interface PortRepairPayload extends RuntimePaths {
  port: number;
}

/** Contrato tipado público (TailLogsPayload). */
export interface TailLogsPayload extends RuntimePaths {
  service: "frontend" | "backend" | "db" | "redis";
  lines: number;
}

/** Contrato tipado público (BackupPayload). */
export interface BackupPayload extends RuntimePaths {
  label: string;
}

/** Contrato tipado público (RestorePayload). */
export interface RestorePayload extends RuntimePaths {
  artifactPath: string;
  confirmationPhrase: string;
}

/** Contrato tipado público (PrunePayload). */
export interface PrunePayload extends RuntimePaths {
  level: "safe" | "aggressive";
  confirmationPhrase: string;
}

/** Contrato tipado público (InstallerProgressEvent). */
export interface InstallerProgressEvent {
  snapshot: InstallerStateSnapshot;
}

/** Contrato tipado público (RuntimeLogEvent). */
export interface RuntimeLogEvent {
  service: string;
  line: string;
  timestamp: string;
}

/** Contrato tipado público (ExportVisibleLogsPayload). */
export interface ExportVisibleLogsPayload extends RuntimePaths {
  logs: RuntimeLogEvent[];
  suggestedFileName?: string;
}

/** Alias de tipo público (DebugLogType). */
export type DebugLogType = "log" | "error" | "warn" | "ipc" | "system";

/** Contrato tipado público (DebugLogEntry). */
export interface DebugLogEntry {
  type: DebugLogType;
  message: string;
  timestamp: number;
  context?: unknown;
  source?: "main" | "renderer";
}
