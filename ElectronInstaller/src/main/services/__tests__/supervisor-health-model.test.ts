import { describe, expect, it } from "vitest";

import { evaluateSupervisorChecks } from "../supervisor-health-model";

describe("supervisor-health-model", () => {
  it("mantiene healthy cuando solo falla com.docker.service y el stack real esta sano", () => {
    const result = evaluateSupervisorChecks(
      [
        {
          id: "docker-desktop",
          label: "Docker Desktop Service",
          state: "warn",
          detail: "DOCKER_SERVICE_STARTMODE_MANUAL: StartMode=Manual.",
          measuredAt: "2026-05-17T20:00:00.000Z",
        },
        {
          id: "docker-engine",
          label: "Docker Engine",
          state: "ok",
          detail: "Docker responde.",
          measuredAt: "2026-05-17T20:00:00.000Z",
        },
        {
          id: "containers-running",
          label: "Contenedores Docker en vivo",
          state: "ok",
          detail: "Todos los contenedores esperados estan presentes.",
          measuredAt: "2026-05-17T20:00:00.000Z",
        },
        {
          id: "containers-health",
          label: "Healthchecks",
          state: "ok",
          detail: "Healthchecks en estado correcto.",
          measuredAt: "2026-05-17T20:00:00.000Z",
        },
        {
          id: "compose-stack",
          label: "Docker Compose stack",
          state: "ok",
          detail: "El stack esta operativo.",
          measuredAt: "2026-05-17T20:00:00.000Z",
        },
      ],
      false,
    );

    expect(result.overallState).toBe("healthy");
    expect(result.incident).toBeNull();
    expect(result.healthModel.systemState).toBe("SYSTEM_OK");
    expect(result.healthModel.auxiliaryIssues).toHaveLength(1);
    expect(
      result.checks.find((check) => check.id === "docker-desktop")?.authority,
    ).toBe("auxiliary");
  });

  it("degrada cuando Docker Engine no responde", () => {
    const result = evaluateSupervisorChecks(
      [
        {
          id: "docker-engine",
          label: "Docker Engine",
          state: "error",
          detail: "Docker no responde a la consulta viva.",
          measuredAt: "2026-05-17T20:00:00.000Z",
        },
      ],
      false,
    );

    expect(result.overallState).toBe("degraded");
    expect(result.incident?.title).toBe("Docker Engine no disponible");
    expect(result.healthModel.systemState).toBe("DOCKER_ENGINE_DOWN");
  });

  it("marca recovering cuando solo hay advertencias primarias transitorias", () => {
    const result = evaluateSupervisorChecks(
      [
        {
          id: "docker-engine",
          label: "Docker Engine",
          state: "ok",
          detail: "Docker responde.",
          measuredAt: "2026-05-17T20:00:00.000Z",
        },
        {
          id: "containers-health",
          label: "Healthchecks",
          state: "warn",
          detail: "Healthchecks todavia arrancando.",
          measuredAt: "2026-05-17T20:00:00.000Z",
        },
      ],
      false,
    );

    expect(result.overallState).toBe("recovering");
    expect(result.healthModel.systemState).toBe("RECOVERING");
  });
});