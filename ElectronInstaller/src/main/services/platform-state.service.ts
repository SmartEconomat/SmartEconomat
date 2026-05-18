import type {
  DockerRuntimeStatus,
  PlatformState,
  ServiceHealth,
  StackState,
} from "@shared/contracts";

import type { SupervisorLifecycleController } from "./supervisor-lifecycle.controller";

export function mapDockerRuntimeToPlatform(
  status: DockerRuntimeStatus,
  inBootGrace: boolean,
): PlatformState {
  switch (status.state) {
    case "not-installed":
      return "NOT_INSTALLED";
    case "desktop-not-running":
      return inBootGrace ? "STABILIZING" : "DESKTOP_STARTING";
    case "daemon-starting":
    case "recovery-in-progress":
      return inBootGrace ? "STABILIZING" : "DAEMON_STARTING";
    case "daemon-ready":
      return "DAEMON_READY";
    case "daemon-error":
    case "compose-error":
      return inBootGrace ? "STABILIZING" : "DAEMON_FAULT";
    default:
      return "UNKNOWN";
  }
}

export function mapHealthToStack(
  health: ServiceHealth[],
  daemonReady: boolean,
  inBootGrace: boolean,
): StackState {
  if (!daemonReady) {
    return "STACK_UNKNOWN";
  }

  if (health.length === 0) {
    return inBootGrace ? "STACK_UNKNOWN" : "STACK_DOWN";
  }

  const hasStarting = health.some((service) => service.status === "starting");
  const hasUnhealthy = health.some((service) => service.status === "unhealthy");
  const hasUnknown = health.some((service) => service.status === "unknown");
  const allUp = health.every(
    (service) =>
      service.status === "healthy" ||
      service.status === "running" ||
      service.status === "starting",
  );

  if (hasStarting && !hasUnhealthy) {
    return "STACK_STARTING";
  }

  if (allUp && !hasUnhealthy && !hasUnknown) {
    return "STACK_HEALTHY";
  }

  if (hasUnhealthy || (!inBootGrace && hasUnknown)) {
    return "STACK_DEGRADED";
  }

  if (hasUnknown && inBootGrace) {
    return "STACK_UNKNOWN";
  }

  return inBootGrace ? "STACK_UNKNOWN" : "STACK_DOWN";
}

export function resolvePlatformAndStack(
  dockerStatus: DockerRuntimeStatus,
  health: ServiceHealth[],
  lifecycle: SupervisorLifecycleController,
): { platform: PlatformState; stack: StackState } {
  const inBootGrace = lifecycle.isInBootGrace();
  const platform = mapDockerRuntimeToPlatform(dockerStatus, inBootGrace);
  const daemonReady = platform === "DAEMON_READY";
  const stack = mapHealthToStack(health, daemonReady, inBootGrace);
  lifecycle.updateFromPlatformStack(platform, stack);
  return { platform, stack };
}
