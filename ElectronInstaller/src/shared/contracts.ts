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
  installMode: "new" | "reinstall";
  adminUsername: string;
  adminPassword: string;
  adminEmail?: string;
  superAdminUsername: string;
  superAdminPassword: string;
  superAdminEmail?: string;
  verifyExistingAdminSession: boolean;
  repairAdminCredentialsOnFailure: boolean;
  verifyAdminUsername?: string;
  verifyAdminPassword?: string;
  useSamePasswordForBoth: boolean;
  localHost: string;
  timezone: string;
  tlsProvider: "selfsigned" | "none" | "custom";
  customCertFullchainPath?: string;
  customCertPrivkeyPath?: string;
  backupDefaultDirectory: string;
  backupFrequency: "off" | "daily" | "weekly";
  backupScheduleTime: string;
  backupRetentionDays: number;
  postgresPassword?: string;
  /** Si vacío en el renderer, se usa `postgres`. */
  postgresUser?: string;
  /** Si vacío en el renderer, se usa `smarteconomat`. */
  postgresDb?: string;
  redisPassword?: string;
  jwtSecret?: string;
  /** Expiración JWT (p. ej. `7d`). Si vacío, `7d`. */
  jwtExpiration?: string;
  /** Ruta i18n custom; vacío = resolución por defecto del backend. */
  i18nPath?: string;
  /** Idioma por defecto i18n (p. ej. `es`). */
  i18nFallbackLanguage?: string;
  sentryDsn?: string;
  viteSentryDsn?: string;
  startupRunMigrations?: boolean;
  httpPort: number;
  httpsPort: number;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  smtpSecure?: boolean;
}

export interface InstallerFilePickerPayload {
  title: string;
  defaultPath?: string;
  buttonLabel?: string;
  pickDirectories?: boolean;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
}

export type InstallerStep =
  | "IDLE"
  | "PREFLIGHT"
  | "CONFIG_VALIDATION"
  | "PRE_INSTALL_BACKUP"
  | "ENV_RENDER"
  | "TLS_SETUP"
  | "DOCKER_DEPLOY"
  | "INITIALIZE_APP"
  | "VERIFY"
  | "DONE"
  | "DONE_WITH_WARNINGS"
  | "FAILED";

export interface InstallerStateSnapshot {
  state: InstallerStep;
  timestamp: string;
  message: string;
  stageLabel?: string;
  progressPercent?: number;
  errorCode?: string;
  warnings?: string[];
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
  archivePath?: string;
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
  destinationDir: string;
}

export interface RestorePayload extends RuntimePaths {
  artifactPath: string;
  confirmationPhrase: string;
}

export interface PrunePayload extends RuntimePaths {
  level: "safe" | "aggressive";
  confirmationPhrase: string;
}

export interface UninstallPayload extends RuntimePaths {
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

export interface InstallerBootState {
  installed: boolean;
  runtimePath: string;
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

// ── Watchdog / Health Push ───────────────────────────────────

export type WatchdogState = "active" | "recovering" | "backoff" | "idle";
export type RecoveryLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type DockerRuntimeState =
  | "not-installed"
  | "desktop-not-running"
  | "daemon-starting"
  | "daemon-ready"
  | "daemon-error"
  | "compose-error"
  | "recovery-in-progress";

export interface DockerRuntimeStatus {
  state: DockerRuntimeState;
  detail: string;
  source: "boot-guardian" | "preflight" | "runtime";
  retries: number;
  lastCheckedAt: string;
}

export interface WatchdogStatus {
  state: WatchdogState;
  consecutiveFailures: number;
  currentRecoveryLevel: RecoveryLevel;
  nextCheckInMs: number;
  lastCheck: string | null;
  dockerStatus?: DockerRuntimeStatus;
}

export interface HealthUpdateEvent {
  health: ServiceHealth[];
  watchdog: WatchdogStatus;
  timestamp: string;
}

export type SupervisorCheckState = "ok" | "warn" | "error";

export interface SupervisorCheck {
  id:
    | "docker-desktop"
    | "docker-engine"
    | "docker-version"
    | "docker-info"
    | "docker-network"
    | "containers-running"
    | "containers-health"
    | "ports"
    | "disk"
    | "memory"
    | "cpu"
    | "http-endpoint"
    | "https-endpoint";
  label: string;
  state: SupervisorCheckState;
  detail: string;
  recommendation?: string;
  measuredAt: string;
}

export type SupervisorOverallState = "healthy" | "recovering" | "degraded";

export interface SupervisorSnapshot {
  overallState: SupervisorOverallState;
  checks: SupervisorCheck[];
  lastAutomaticActionAt: string | null;
  lastAutomaticAction: string | null;
  uptimeSeconds: number;
}
