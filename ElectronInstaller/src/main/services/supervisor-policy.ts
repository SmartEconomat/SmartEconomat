import type { ExecutionContext, LifecyclePhase } from "@shared/contracts";

/** Gracia inicial tras arranque de sesión Electron (5 min). */
export const BOOT_GRACE_MS = 5 * 60_000;

/** Gracia máxima en equipos lentos (15 min). */
export const BOOT_GRACE_MAX_MS = 15 * 60_000;

/** Extensión por cada N probes fallidos durante gracia. */
export const SLOW_MACHINE_EXTEND_MS = 2 * 60_000;
export const SLOW_MACHINE_PROBE_FAILURES_FOR_EXTEND = 3;

export const BOOT_OBSERVE_INTERVAL_MS = 60_000;
export const BOOT_OBSERVE_MAX_INTERVAL_MS = 5 * 60_000;
export const RUNTIME_OBSERVE_INTERVAL_MS = 30_000;
export const RUNTIME_OBSERVE_MAX_INTERVAL_MS = 10 * 60_000;

export const BOOT_PERSISTENCE_THRESHOLD = 3;
export const RUNTIME_PERSISTENCE_THRESHOLD = 3;
export const BOOT_PERSISTENCE_INTERVAL_MS = 90_000;
export const RUNTIME_PERSISTENCE_INTERVAL_MS = 30_000;

export const LIGHT_RECOVERY_COOLDOWN_MS = 5 * 60_000;
export const STRONG_RECOVERY_COOLDOWN_MS = 15 * 60_000;

export const MAX_LIGHT_REPAIRS_PER_SESSION = 5;
export const MAX_STRONG_REPAIRS_PER_SESSION = 3;

export function allowsElevation(context: ExecutionContext): boolean {
  return context === "install" || context === "user-repair";
}

export function allowsDockerMutation(context: ExecutionContext): boolean {
  return context !== "observe";
}

export function allowsDestructiveDocker(context: ExecutionContext): boolean {
  return context === "install" || context === "user-repair";
}

export function allowsAutomaticRecovery(phase: LifecyclePhase): boolean {
  return phase === "RUNTIME" || phase === "INCIDENT";
}

export function computeObserveIntervalMs(
  phase: LifecyclePhase,
  consecutiveFailures: number,
): number {
  const base =
    phase === "OBSERVE_ONLY"
      ? BOOT_OBSERVE_INTERVAL_MS
      : RUNTIME_OBSERVE_INTERVAL_MS;
  const max =
    phase === "OBSERVE_ONLY"
      ? BOOT_OBSERVE_MAX_INTERVAL_MS
      : RUNTIME_OBSERVE_MAX_INTERVAL_MS;
  return computeBackoffInterval(base, max, consecutiveFailures);
}

export function computeBackoffInterval(
  baseIntervalMs: number,
  maxIntervalMs: number,
  consecutiveFailures: number,
): number {
  if (consecutiveFailures <= 0) {
    return baseIntervalMs;
  }
  const exponentialDelay = baseIntervalMs * Math.pow(2, consecutiveFailures);
  return Math.min(exponentialDelay, maxIntervalMs);
}

export function shouldRunRecovery(
  nowMs: number,
  lastRecoveryAttemptAtMs: number,
  cooldownMs: number,
): boolean {
  if (lastRecoveryAttemptAtMs <= 0) {
    return true;
  }
  return nowMs - lastRecoveryAttemptAtMs >= cooldownMs;
}

export function executionContextForPhase(
  phase: LifecyclePhase,
  manual: boolean,
): ExecutionContext {
  if (manual) {
    return "user-repair";
  }
  if (phase === "OBSERVE_ONLY") {
    return "observe";
  }
  return "runtime-auto-light";
}
