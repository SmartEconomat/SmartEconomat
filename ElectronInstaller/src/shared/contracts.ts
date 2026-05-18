export type CheckStatus = "OK" | "WARN" | "BLOCKER";

export interface PreflightCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  recommendation?: string;
  repairable?: boolean;
  repairAction?:
    | "auto-repair"
    | "release-port"
    | "open-security"
    | "trust-certificate";
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
  superAdminUsername: string;
  superAdminPassword: string;
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
  redisPassword?: string;
  jwtSecret?: string;
  sentryDsn?: string;
  viteSentryDsn?: string;
  startupRunMigrations?: boolean;
  httpPort: number;
  httpsPort: number;
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

// ── Ciclo de vida y contexto de ejecución (supervisión) ─────────────────

export type LifecyclePhase = "OBSERVE_ONLY" | "RUNTIME" | "INCIDENT";

export type ExecutionContext =
  | "observe"
  | "runtime-auto-light"
  | "user-repair"
  | "install";

export type PlatformState =
  | "UNKNOWN"
  | "STABILIZING"
  | "DESKTOP_STARTING"
  | "DAEMON_STARTING"
  | "DAEMON_READY"
  | "DAEMON_FAULT"
  | "NOT_INSTALLED";

export type StackState =
  | "STACK_UNKNOWN"
  | "STACK_STARTING"
  | "STACK_DEGRADED"
  | "STACK_DOWN"
  | "STACK_HEALTHY";

export type IncidentLifecycle =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "REPAIRING"
  | "RESOLVED";

export type TraySupervisorState =
  | "healthy"
  | "recovering"
  | "degraded"
  | "stabilizing";

// ── Docker runtime (legacy + mapeo a PlatformState) ─────────────────────

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
  source: "boot-guardian" | "runtime" | "preflight" | "orchestrator";
  retries: number;
  lastCheckedAt: string;
}

// ── Watchdog / guardian ─────────────────────────────────────────────────

export type WatchdogState =
  | "idle"
  | "active"
  | "recovering"
  | "backoff";

export type RecoveryLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface WatchdogStatus {
  state: WatchdogState;
  consecutiveFailures: number;
  currentRecoveryLevel: RecoveryLevel;
  nextCheckInMs: number;
  lastCheck: string;
  dockerStatus?: DockerRuntimeStatus;
}

// ── Supervisor snapshot ─────────────────────────────────────────────────

export type SupervisorOverallState =
  | "healthy"
  | "recovering"
  | "degraded"
  | "stabilizing";

export interface SupervisorCheck {
  id: string;
  label: string;
  state: "ok" | "warn" | "error";
  detail: string;
  measuredAt: string;
  authority?: "primary" | "secondary" | "auxiliary";
  affectsOverall?: boolean;
}

export type SupervisorSystemHealth =
  | "SYSTEM_OK"
  | "STARTING"
  | "RECOVERING"
  | "DOCKER_ENGINE_DOWN"
  | "STACK_PARTIAL"
  | "CONTAINER_UNHEALTHY"
  | "UNKNOWN";

export interface SupervisorHealthModel {
  systemState: SupervisorSystemHealth;
  sourceOfTruth: "live-docker" | "windows-supervisor" | "hybrid";
  summary: string;
  primaryIssues: string[];
  auxiliaryIssues: string[];
}

export interface SupervisorIncident {
  id: string;
  service: string;
  title: string;
  detail: string;
  severity: "warn" | "error" | "critical";
  state: "open" | "resolved";
  detectedAt: string;
  resolvedAt?: string;
  occurrences: number;
  lifecycle?: IncidentLifecycle;
}

export interface SupervisorPlatformSnapshot {
  platform: PlatformState;
  stack: StackState;
  lifecyclePhase: LifecyclePhase;
  bootGraceRemainingMs?: number;
}

export interface SupervisorSnapshot {
  overallState: SupervisorOverallState;
  checks: SupervisorCheck[];
  lastAutomaticActionAt: string | null;
  lastAutomaticAction: string | null;
  uptimeSeconds: number;
  incidentsResolved: number;
  incidentsOpen: number;
  lastIncidentAt: string | null;
  latestIncident: SupervisorIncident | null;
  recentIncidents: SupervisorIncident[];
  platform?: SupervisorPlatformSnapshot;
  healthModel?: SupervisorHealthModel;
}

export interface HealthUpdateEvent {
  health: ServiceHealth[];
  watchdog: WatchdogStatus;
  supervisorSnapshot?: SupervisorSnapshot;
  timestamp: string;
}

// ── Instalador / runtime auxiliar ───────────────────────────────────────

export interface InstallerBootState {
  installed: boolean;
  runtimePath: string;
}

export interface UninstallPayload extends RuntimePaths {
  confirmationPhrase: string;
}
