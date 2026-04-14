export type CheckStatus = "OK" | "WARN" | "BLOCKER";

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

export interface PreflightReport {
  generatedAt: string;
  checks: PreflightCheck[];
}

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

export interface InstallerFilePickerPayload {
  title: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
}

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

export interface InstallerStateSnapshot {
  state: InstallerStep;
  timestamp: string;
  message: string;
  stageLabel?: string;
  progressPercent?: number;
  errorCode?: string;
}

export interface InstallJournalEntry extends InstallerStateSnapshot {
  context?: Record<string, string | number | boolean>;
}

export interface ServiceHealth {
  service: "frontend" | "backend" | "db" | "redis";
  status: "healthy" | "running" | "unhealthy" | "starting" | "unknown";
  detail: string;
}

export interface CommandResult {
  ok: boolean;
  code: number;
  stdout: string;
  stderr: string;
  message: string;
}

export interface BackupMetadata {
  appVersion: string;
  schemaVersion: string;
  createdAt: string;
  checksum: string;
  archiveName: string;
}

export interface OperationResult<T = undefined> {
  ok: boolean;
  message: string;
  data?: T;
  errorCode?: string;
}

export interface RuntimePaths {
  runtimePath: string;
}

export interface PortRepairPayload extends RuntimePaths {
  port: number;
}

export interface TailLogsPayload extends RuntimePaths {
  service: "frontend" | "backend" | "db" | "redis";
  lines: number;
}

export interface BackupPayload extends RuntimePaths {
  label: string;
}

export interface RestorePayload extends RuntimePaths {
  artifactPath: string;
  confirmationPhrase: string;
}

export interface PrunePayload extends RuntimePaths {
  level: "safe" | "aggressive";
  confirmationPhrase: string;
}

export interface InstallerProgressEvent {
  snapshot: InstallerStateSnapshot;
}

export interface RuntimeLogEvent {
  service: string;
  line: string;
  timestamp: string;
}

export interface ExportVisibleLogsPayload extends RuntimePaths {
  logs: RuntimeLogEvent[];
  suggestedFileName?: string;
}

export type DebugLogType = "log" | "error" | "warn" | "ipc" | "system";

export interface DebugLogEntry {
  type: DebugLogType;
  message: string;
  timestamp: number;
  context?: unknown;
  source?: "main" | "renderer";
}
