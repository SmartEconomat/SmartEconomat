import type {
  SupervisorCheck,
  SupervisorHealthModel,
  SupervisorIncident,
  SupervisorOverallState,
  SupervisorSystemHealth,
} from "@shared/contracts";

interface EvaluatedSupervisorChecks {
  checks: SupervisorCheck[];
  overallState: SupervisorOverallState;
  incident: SupervisorIncident | null;
  healthModel: SupervisorHealthModel;
}

const AUXILIARY_CHECK_IDS = new Set(["docker-desktop"]);
const SECONDARY_CHECK_IDS = new Set(["wsl2"]);

function normalizeCheck(check: SupervisorCheck): SupervisorCheck {
  if (check.authority && typeof check.affectsOverall === "boolean") {
    return check;
  }

  const authority = AUXILIARY_CHECK_IDS.has(check.id)
    ? "auxiliary"
    : SECONDARY_CHECK_IDS.has(check.id)
      ? "secondary"
      : "primary";

  return {
    ...check,
    authority,
    affectsOverall: check.affectsOverall ?? authority === "primary",
  };
}

function summarizeCheck(check: SupervisorCheck): string {
  return `${check.label}: ${check.detail}`;
}

function isDockerEngineError(check: SupervisorCheck): boolean {
  return check.id === "docker-engine";
}

function isContainerHealthError(check: SupervisorCheck): boolean {
  return (
    check.id === "containers-health" ||
    /healthcheck|incidencia|unhealthy/i.test(check.detail)
  );
}

function isStackTopologyError(check: SupervisorCheck): boolean {
  return check.id === "containers-running" || check.id === "compose-stack";
}

function resolveSystemHealth(
  primaryErrors: SupervisorCheck[],
  primaryWarnings: SupervisorCheck[],
  authoritativeChecks: SupervisorCheck[],
  inBootGrace: boolean,
): SupervisorSystemHealth {
  if (primaryErrors.some(isDockerEngineError)) {
    return "DOCKER_ENGINE_DOWN";
  }

  if (primaryErrors.some(isContainerHealthError)) {
    return "CONTAINER_UNHEALTHY";
  }

  if (primaryErrors.some(isStackTopologyError)) {
    return "STACK_PARTIAL";
  }

  if (primaryWarnings.length > 0) {
    return inBootGrace ? "STARTING" : "RECOVERING";
  }

  if (authoritativeChecks.length === 0) {
    return "UNKNOWN";
  }

  return "SYSTEM_OK";
}

function buildSummary(
  systemState: SupervisorSystemHealth,
  auxiliaryIssues: SupervisorCheck[],
): string {
  if (systemState === "DOCKER_ENGINE_DOWN") {
    return "Docker Engine no responde a la comprobación viva del sentinela.";
  }

  if (systemState === "STACK_PARTIAL") {
    return "El stack Compose no está completo o faltan contenedores obligatorios.";
  }

  if (systemState === "CONTAINER_UNHEALTHY") {
    return "Uno o más contenedores tienen healthchecks fallidos o estado no saludable.";
  }

  if (systemState === "STARTING") {
    return "El sentinela está observando un arranque transitorio del entorno Docker.";
  }

  if (systemState === "RECOVERING") {
    return "Hay verificaciones transitorias pendientes, pero no se confirmó un fallo operativo del stack.";
  }

  if (systemState === "UNKNOWN") {
    return "Aún no hay suficiente telemetría operativa para clasificar el estado real del stack.";
  }

  if (auxiliaryIssues.length > 0) {
    return `Docker Engine y el stack están operativos. Hay ${auxiliaryIssues.length} señal(es) auxiliares de Windows que no degradan la salud real del sistema.`;
  }

  return "Docker Engine y el stack Compose están operativos y verificados.";
}

function buildIncidentTitle(systemState: SupervisorSystemHealth): string {
  switch (systemState) {
    case "DOCKER_ENGINE_DOWN":
      return "Docker Engine no disponible";
    case "CONTAINER_UNHEALTHY":
      return "Contenedor con healthcheck fallido";
    case "STACK_PARTIAL":
      return "Stack Compose incompleto";
    default:
      return "Estado real Docker degradado";
  }
}

export function evaluateSupervisorChecks(
  liveChecks: SupervisorCheck[],
  inBootGrace: boolean,
): EvaluatedSupervisorChecks {
  const checks = liveChecks.map(normalizeCheck);
  const authoritativeChecks = checks.filter(
    (check) => check.affectsOverall !== false,
  );
  const primaryErrors = authoritativeChecks.filter(
    (check) => check.state === "error",
  );
  const primaryWarnings = authoritativeChecks.filter(
    (check) => check.state === "warn",
  );
  const auxiliaryIssues = checks.filter(
    (check) => check.authority === "auxiliary" && check.state !== "ok",
  );

  const overallState: SupervisorOverallState =
    primaryErrors.length > 0
      ? inBootGrace
        ? "stabilizing"
        : "degraded"
      : primaryWarnings.length > 0
        ? inBootGrace
          ? "stabilizing"
          : "recovering"
        : "healthy";

  const systemState = resolveSystemHealth(
    primaryErrors,
    primaryWarnings,
    authoritativeChecks,
    inBootGrace,
  );
  const healthModel: SupervisorHealthModel = {
    systemState,
    sourceOfTruth: "live-docker",
    summary: buildSummary(systemState, auxiliaryIssues),
    primaryIssues: authoritativeChecks
      .filter((check) => check.state !== "ok")
      .map(summarizeCheck),
    auxiliaryIssues: auxiliaryIssues.map(summarizeCheck),
  };

  const primaryError = primaryErrors[0];
  const incident =
    overallState === "degraded"
      ? {
          id: `live-${systemState.toLowerCase()}`,
          service: "docker",
          title: buildIncidentTitle(systemState),
          detail:
            primaryError?.detail ??
            "El sentinela detectó un problema operativo en Docker.",
          severity: "critical" as const,
          state: "open" as const,
          detectedAt: new Date().toISOString(),
          occurrences: 1,
        }
      : null;

  return {
    checks,
    overallState,
    incident,
    healthModel,
  };
}