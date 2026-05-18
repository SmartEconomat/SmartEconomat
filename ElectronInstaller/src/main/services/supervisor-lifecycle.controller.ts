import type { LifecyclePhase, PlatformState, StackState } from "@shared/contracts";

import {
  bootGraceRemainingMs,
  isInBootGrace,
  isPlatformStabilizing,
  isStackUncertain,
  resetIncidentObservations,
} from "./incident-policy";

export class SupervisorLifecycleController {
  private phase: LifecyclePhase = "OBSERVE_ONLY";
  private readonly sessionStartedAtMs = Date.now();
  private failedProbeCount = 0;
  private lastPlatform: PlatformState = "UNKNOWN";
  private lastStack: StackState = "STACK_UNKNOWN";

  constructor() {
    resetIncidentObservations();
  }

  getPhase(): LifecyclePhase {
    return this.phase;
  }

  getSessionStartedAtMs(): number {
    return this.sessionStartedAtMs;
  }

  getFailedProbeCount(): number {
    return this.failedProbeCount;
  }

  recordProbeFailure(): void {
    this.failedProbeCount += 1;
  }

  recordProbeSuccess(): void {
    // Mantener contador para gracia adaptativa; no resetear en cada éxito parcial.
  }

  isInBootGrace(nowMs: number = Date.now()): boolean {
    return isInBootGrace(
      this.sessionStartedAtMs,
      nowMs,
      this.failedProbeCount,
    );
  }

  getBootGraceRemainingMs(nowMs: number = Date.now()): number {
    return bootGraceRemainingMs(
      this.sessionStartedAtMs,
      nowMs,
      this.failedProbeCount,
    );
  }

  updateFromPlatformStack(
    platform: PlatformState,
    stack: StackState,
    nowMs: number = Date.now(),
  ): LifecyclePhase {
    this.lastPlatform = platform;
    this.lastStack = stack;

    if (this.isInBootGrace(nowMs) || isPlatformStabilizing(platform)) {
      this.phase = "OBSERVE_ONLY";
      return this.phase;
    }

    if (isStackUncertain(stack, false) && platform !== "DAEMON_READY") {
      this.phase = "OBSERVE_ONLY";
      return this.phase;
    }

    if (platform === "DAEMON_FAULT" || stack === "STACK_DOWN" || stack === "STACK_DEGRADED") {
      this.phase = "INCIDENT";
      return this.phase;
    }

    if (
      platform === "DAEMON_READY" &&
      (stack === "STACK_HEALTHY" || stack === "STACK_STARTING")
    ) {
      this.phase = "RUNTIME";
      return this.phase;
    }

    this.phase = "OBSERVE_ONLY";
    return this.phase;
  }

  getLastPlatform(): PlatformState {
    return this.lastPlatform;
  }

  getLastStack(): StackState {
    return this.lastStack;
  }

  forcePhase(phase: LifecyclePhase): void {
    this.phase = phase;
  }
}
