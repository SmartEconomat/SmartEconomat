/** Alias de tipo público (FirewallDecisionSeverity). */
export type FirewallDecisionSeverity = "critical" | "degraded" | "warning";

/** Alias de tipo público (FirewallPlanAction). */
export type FirewallPlanAction =
  | "noop"
  | "update"
  | "replace"
  | "createVersioned"
  | "warnOnly";

/** Contrato tipado público (FirewallPortRuleSnapshot). */
export interface FirewallPortRuleSnapshot {
  ruleName: string;
  localPort: number;
  direction: "Inbound" | "Outbound" | string;
  protocol: "TCP" | "UDP" | string;
  action: "Allow" | "Block" | string;
  enabled: boolean;
  profileRaw: string;
}

/** Contrato tipado público (FirewallDetectionResult). */
export interface FirewallDetectionResult {
  isWindows: boolean;
  ports: number[];
  isAdminLikely: boolean;
  rules: FirewallPortRuleSnapshot[];
  legacyRuleCount: number;
  duplicatePorts: number[];
  detectionErrors: string[];
}

/** Contrato tipado público (FirewallPlanOperation). */
export interface FirewallPlanOperation {
  type: "delete" | "set" | "create";
  port: number;
  ruleName: string;
  reason: string;
}

/** Contrato tipado público (FirewallPlan). */
export interface FirewallPlan {
  action: FirewallPlanAction;
  severity: FirewallDecisionSeverity;
  operations: FirewallPlanOperation[];
  summary: string;
  canContinue: boolean;
}

/** Contrato tipado público (FirewallExecutionStep). */
export interface FirewallExecutionStep {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  command: string;
  ok: boolean;
  stdout: string;
  stderr: string;
  message: string;
}

/** Contrato tipado público (FirewallExecutionResult). */
export interface FirewallExecutionResult {
  ok: boolean;
  usedElevation: boolean;
  usedFallbackNetsh: boolean;
  timedOut: boolean;
  steps: FirewallExecutionStep[];
  errors: string[];
}

/** Contrato tipado público (FirewallConnectivityResult). */
export interface FirewallConnectivityResult {
  localhostHttp: boolean;
  localhostHttps: boolean;
  localDomainHttp: boolean;
  localDomainHttps: boolean;
  dnsLoopback: boolean;
  listeningPorts: number[];
  localhostHttpErrorCode?: string;
  localhostHttpsErrorCode?: string;
  localDomainHttpErrorCode?: string;
  localDomainHttpsErrorCode?: string;
  lanProbeAttempted: boolean;
  lanProbeOk: boolean;
}

/** Contrato tipado público (FirewallVerificationResult). */
export interface FirewallVerificationResult {
  rulesConsistent: boolean;
  connectivity: FirewallConnectivityResult;
  message: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  connectivityChecksDeferred?: boolean;
}

/** Contrato tipado público (FirewallEnsureSummary). */
export interface FirewallEnsureSummary {
  ok: boolean;
  canContinue: boolean;
  severity: FirewallDecisionSeverity;
  userMessage: string;
  technicalMessage: string;
  warningCode?: string;
  diagnostics: {
    detection: FirewallDetectionResult;
    plan: FirewallPlan;
    execution: FirewallExecutionResult;
    verification: FirewallVerificationResult;
  };
}

/** Contrato tipado público (FirewallEnsureContext). */
export interface FirewallEnsureContext {
  httpPort: number;
  httpsPort: number;
  host: string;
  runtimePath: string;
  log: (line: string) => void;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  verificationMode?: "preHostMapping" | "postHostMapping" | "default";
}
