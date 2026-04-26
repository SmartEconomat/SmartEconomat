export type FirewallDecisionSeverity = "critical" | "degraded" | "warning";

export type FirewallPlanAction =
  | "noop"
  | "update"
  | "replace"
  | "createVersioned"
  | "warnOnly";

export interface FirewallPortRuleSnapshot {
  ruleName: string;
  localPort: number;
  direction: "Inbound" | "Outbound" | string;
  protocol: "TCP" | "UDP" | string;
  action: "Allow" | "Block" | string;
  enabled: boolean;
  profileRaw: string;
}

export interface FirewallDetectionResult {
  isWindows: boolean;
  ports: number[];
  isAdminLikely: boolean;
  rules: FirewallPortRuleSnapshot[];
  legacyRuleCount: number;
  duplicatePorts: number[];
  detectionErrors: string[];
}

export interface FirewallPlanOperation {
  type: "delete" | "set" | "create";
  port: number;
  ruleName: string;
  reason: string;
}

export interface FirewallPlan {
  action: FirewallPlanAction;
  severity: FirewallDecisionSeverity;
  operations: FirewallPlanOperation[];
  summary: string;
  canContinue: boolean;
}

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

export interface FirewallExecutionResult {
  ok: boolean;
  usedElevation: boolean;
  usedFallbackNetsh: boolean;
  timedOut: boolean;
  steps: FirewallExecutionStep[];
  errors: string[];
}

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

export interface FirewallVerificationResult {
  rulesConsistent: boolean;
  connectivity: FirewallConnectivityResult;
  message: string;
        /**
     * Documentación en español.
     */
  connectivityChecksDeferred?: boolean;
}

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

export interface FirewallEnsureContext {
  httpPort: number;
  httpsPort: number;
  host: string;
  runtimePath: string;
  log: (line: string) => void;
        /**
     * Documentación en español.
     */
  verificationMode?: "preHostMapping" | "postHostMapping" | "default";
}
