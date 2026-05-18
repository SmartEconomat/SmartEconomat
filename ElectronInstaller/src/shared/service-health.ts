import type { ServiceHealth } from "./contracts";

export const MONITORED_SERVICES: ServiceHealth["service"][] = [
  "backend",
  "frontend",
  "db",
  "redis",
];

export function isOperationalServiceStatus(
  status: ServiceHealth["status"],
): boolean {
  return (
    status === "healthy" || status === "running" || status === "starting"
  );
}

export function buildMonitoredServiceHealth(
  health: ServiceHealth[],
): ServiceHealth[] {
  return MONITORED_SERVICES.map((serviceName) => {
    const matched = health.find((service) => service.service === serviceName);
    if (matched) {
      return matched;
    }

    return {
      service: serviceName,
      status: "unknown",
      detail: "Estado pendiente de verificación.",
    };
  });
}

export function countOperationalServices(health: ServiceHealth[]): {
  up: number;
  total: number;
} {
  const monitored = buildMonitoredServiceHealth(health);
  return {
    up: monitored.filter((service) =>
      isOperationalServiceStatus(service.status),
    ).length,
    total: monitored.length,
  };
}
