import { describe, expect, it } from "vitest";

import { parseComposeHealthOutput } from "../docker-orchestrator.service";

describe("parseComposeHealthOutput", () => {
  it("mapea salida JSON de compose a estado de servicios", () => {
    const raw = JSON.stringify([
      {
        Service: "backend",
        State: "running",
        Health: "healthy",
      },
      {
        Service: "redis",
        State: "running",
        Health: "unhealthy",
      },
    ]);

    const parsed = parseComposeHealthOutput(raw);

    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.service).toBe("backend");
    expect(parsed[0]?.status).toBe("healthy");
    expect(parsed[1]?.service).toBe("redis");
    expect(parsed[1]?.status).toBe("unhealthy");
  });

  it("soporta salida NDJSON de docker compose", () => {
    const raw = [
      JSON.stringify({ Service: "frontend", State: "running" }),
      JSON.stringify({
        Service: "backend",
        State: "starting",
        Health: "starting",
      }),
    ].join("\n");

    const parsed = parseComposeHealthOutput(raw);

    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.service).toBe("frontend");
    expect(parsed[0]?.status).toBe("running");
    expect(parsed[1]?.service).toBe("backend");
    expect(parsed[1]?.status).toBe("starting");
  });

  it("retorna lista vacía cuando la salida es inválida", () => {
    const parsed = parseComposeHealthOutput("invalid-json");
    expect(parsed).toHaveLength(0);
  });
});
