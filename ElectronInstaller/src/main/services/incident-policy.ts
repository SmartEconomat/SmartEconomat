import type { LifecyclePhase, PlatformState, StackState } from "@shared/contracts";

import {
  BOOT_GRACE_MAX_MS,
  BOOT_GRACE_MS,
  BOOT_PERSISTENCE_INTERVAL_MS,
  BOOT_PERSISTENCE_THRESHOLD,
  RUNTIME_PERSISTENCE_INTERVAL_MS,
  RUNTIME_PERSISTENCE_THRESHOLD,
  SLOW_MACHINE_EXTEND_MS,
  SLOW_MACHINE_PROBE_FAILURES_FOR_EXTEND,
} from "./supervisor-policy";

export type IncidentDecision =
  | "wait"
  | "open"
  | "eligible-for-light-repair"
  | "eligible-for-strong-repair";

interface ObservationRecord {
  count: number;
  firstSeenAtMs: number;
  lastSeenAtMs: number;
}

const observations = new Map<string, ObservationRecord>();

export function resetIncidentObservations(): void {
  observations.clear();
}

export function recordObservation(
  key: string,
  isFailure: boolean,
  nowMs: number,
  lifecyclePhase: LifecyclePhase,
): IncidentDecision {
  if (!isFailure) {
    observations.delete(key);
    return "wait";
  }

  if (lifecyclePhase === "OBSERVE_ONLY") {
    return "wait";
  }

  const threshold =
    lifecyclePhase === "RUNTIME"
      ? RUNTIME_PERSISTENCE_THRESHOLD
      : BOOT_PERSISTENCE_THRESHOLD;
  const minIntervalMs =
    lifecyclePhase === "RUNTIME"
      ? RUNTIME_PERSISTENCE_INTERVAL_MS
      : BOOT_PERSISTENCE_INTERVAL_MS;

  const existing = observations.get(key);
  if (!existing) {
    observations.set(key, {
      count: 1,
      firstSeenAtMs: nowMs,
      lastSeenAtMs: nowMs,
    });
    return "wait";
  }

  if (nowMs - existing.lastSeenAtMs < minIntervalMs) {
    return "wait";
  }

  existing.count += 1;
  existing.lastSeenAtMs = nowMs;

  if (existing.count < threshold) {
    return "wait";
  }

  return lifecyclePhase === "INCIDENT"
    ? "eligible-for-strong-repair"
    : "eligible-for-light-repair";
}

export function isPlatformStabilizing(platform: PlatformState): boolean {
  return (
    platform === "UNKNOWN" ||
    platform === "STABILIZING" ||
    platform === "DESKTOP_STARTING" ||
    platform === "DAEMON_STARTING"
  );
}

export function isStackUncertain(stack: StackState, inBootGrace: boolean): boolean {
  if (inBootGrace && (stack === "STACK_UNKNOWN" || stack === "STACK_STARTING")) {
    return true;
  }
  return stack === "STACK_STARTING";
}

export function computeAdaptiveBootGraceEndMs(
  sessionStartedAtMs: number,
  failedProbeCount: number,
): number {
  let graceEnd = sessionStartedAtMs + BOOT_GRACE_MS;
  if (failedProbeCount >= SLOW_MACHINE_PROBE_FAILURES_FOR_EXTEND) {
    const extensions = Math.floor(
      failedProbeCount / SLOW_MACHINE_PROBE_FAILURES_FOR_EXTEND,
    );
    graceEnd = Math.min(
      sessionStartedAtMs +
        BOOT_GRACE_MS +
        extensions * SLOW_MACHINE_EXTEND_MS,
      sessionStartedAtMs + BOOT_GRACE_MAX_MS,
    );
  }
  return graceEnd;
}

export function isInBootGrace(
  sessionStartedAtMs: number,
  nowMs: number,
  failedProbeCount: number,
): boolean {
  return nowMs < computeAdaptiveBootGraceEndMs(sessionStartedAtMs, failedProbeCount);
}

export function bootGraceRemainingMs(
  sessionStartedAtMs: number,
  nowMs: number,
  failedProbeCount: number,
): number {
  return Math.max(
    0,
    computeAdaptiveBootGraceEndMs(sessionStartedAtMs, failedProbeCount) - nowMs,
  );
}
