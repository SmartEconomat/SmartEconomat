import { describe, expect, it } from "vitest";

import type { CommandResult } from "@shared/contracts";

import { DockerReadinessService } from "../docker-readiness.service";

function result(input: Partial<CommandResult>): CommandResult {
  return {
    ok: input.ok ?? false,
    code: input.code ?? (input.ok ? 0 : 1),
    stdout: input.stdout ?? "",
    stderr: input.stderr ?? "",
    message: input.message ?? (input.ok ? "ok" : "fail"),
  };
}

describe("DockerReadinessService.probe", () => {
  it("detecta estado not-installed cuando docker no existe", async () => {
    const fakeRunner = {
      run: async () =>
        result({
          ok: false,
          message: "Failed to spawn process",
          stderr: "spawn docker ENOENT",
        }),
    };

    const service = new DockerReadinessService(fakeRunner as never);
    const status = await service.probe({ source: "preflight" });

    expect(status.state).toBe("not-installed");
    expect(status.source).toBe("preflight");
  });

  it("detecta daemon-error cuando docker ps falla tras docker info correcto", async () => {
    const outputs: CommandResult[] = [
      result({ ok: true, stdout: "Docker version 26.1.1" }),
      result({ ok: true, stdout: "RUNNING" }),
      result({ ok: false, stderr: "Cannot connect to the Docker daemon" }),
    ];

    const fakeRunner = {
      run: async () =>
        outputs.shift() ?? result({ ok: false, stderr: "missing" }),
    };

    const service = new DockerReadinessService(fakeRunner as never);
    const status = await service.probe({ source: "preflight" });

    expect(status.state).toBe("daemon-error");
  });

  it("detecta daemon-ready cuando info y ps responden", async () => {
    const outputs: CommandResult[] = [
      result({ ok: true, stdout: "Docker version 26.1.1" }),
      result({ ok: true, stdout: "RUNNING" }),
      result({ ok: true, stdout: "26.1.1" }),
      result({ ok: true, stdout: "abc123" }),
    ];

    const fakeRunner = {
      run: async () =>
        outputs.shift() ?? result({ ok: false, stderr: "missing" }),
    };

    const service = new DockerReadinessService(fakeRunner as never);
    const status = await service.probe({ source: "runtime" });

    expect(status.state).toBe("daemon-ready");
    expect(status.source).toBe("runtime");
  });

  it("detecta daemon-starting cuando el daemon aún no acepta conexiones", async () => {
    const outputs: CommandResult[] = [
      result({ ok: true, stdout: "Docker version 26.1.1" }),
      result({
        ok: false,
        stderr:
          "error during connect: This error may indicate that the docker daemon is not running",
      }),
      result({ ok: true, stdout: "RUNNING" }),
    ];
    const fakeRunner = {
      run: async () =>
        outputs.shift() ?? result({ ok: false, stderr: "missing" }),
    };
    const service = new DockerReadinessService(fakeRunner as never);
    const status = await service.probe({ source: "boot-guardian" });
    expect(status.state).toBe("daemon-starting");
  });
});
