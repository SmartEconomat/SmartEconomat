import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { PathResolverService } from "../path-resolver.service";
import type { ProcessRunnerService } from "../process-runner.service";
import {
  DockerOrchestratorService,
  isDockerDesktopLinuxPipeError,
  parseDockerContextNames,
  parseComposeHealthOutput,
} from "../docker-orchestrator.service";

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

describe("isDockerDesktopLinuxPipeError", () => {
  it("detecta error del pipe dockerDesktopLinuxEngine", () => {
    expect(
      isDockerDesktopLinuxPipeError(
        "open //./pipe/dockerDesktopLinuxEngine: file not found",
      ),
    ).toBe(true);
  });

  it("ignora errores no relacionados con ese pipe", () => {
    expect(
      isDockerDesktopLinuxPipeError(
        "Cannot connect to the Docker daemon at unix:///var/run/docker.sock",
      ),
    ).toBe(false);
  });
});

describe("parseDockerContextNames", () => {
  it("parsea nombres con o sin marcador de contexto activo", () => {
    expect(
      parseDockerContextNames(
        ["default *", "desktop-linux", "custom"].join("\n"),
      ),
    ).toEqual(["default", "desktop-linux", "custom"]);
  });
});

describe("DockerOrchestratorService context recovery", () => {
  it("detecta contexto operativo y completa deploy usándolo explícitamente", async () => {
    const runtimePath = await createFakeRuntime();
    const calls: Array<{ command: string; args: string[] }> = [];

    const processRunner = {
      run: async (options: { command: string; args: string[] }) => {
        calls.push({ command: options.command, args: options.args });
        const commandLine = options.args.join(" ");

        if (commandLine.includes("Get-Service -Name 'com.docker.service'")) {
          return {
            ok: true,
            code: 0,
            stdout: "Running",
            stderr: "",
            message: "ok",
          };
        }

        if (
          options.args[0] === "info" ||
          (options.args[0] === "--context" &&
            options.args[1] === "default" &&
            options.args[2] === "info")
        ) {
          return {
            ok: false,
            code: 1,
            stdout: "",
            stderr: "open //./pipe/dockerDesktopLinuxEngine",
            message: "failed",
          };
        }

        if (options.args[0] === "context" && options.args[1] === "ls") {
          return {
            ok: true,
            code: 0,
            stdout: "default\ndesktop-linux",
            stderr: "",
            message: "ok",
          };
        }

        if (
          options.args[0] === "--context" &&
          options.args[1] === "desktop-linux" &&
          options.args[2] === "info"
        ) {
          return {
            ok: true,
            code: 0,
            stdout: "26.1.0",
            stderr: "",
            message: "ok",
          };
        }

        return { ok: true, code: 0, stdout: "", stderr: "", message: "ok" };
      },
    };

    const pathResolver = {
      getProjectRoot: () => process.cwd(),
    };

    const service = new DockerOrchestratorService(
      pathResolver as PathResolverService,
      processRunner as ProcessRunnerService,
      { dockerStartupWaitMs: 0, dockerStartupPollMs: 0 },
    );

    const result = await service.startStack(runtimePath);

    expect(result.ok).toBe(true);
    expect(
      calls.some(
        (call) =>
          call.args[0] === "--context" &&
          call.args[1] === "desktop-linux" &&
          call.args[2] === "compose",
      ),
    ).toBe(true);
  });

  it("no bloquea Windows si com.docker.service no puede arrancar pero el daemon ya responde", async () => {
    const runtimePath = await createFakeRuntime();
    const calls: Array<{ command: string; args: string[] }> = [];

    const processRunner = {
      run: async (options: { command: string; args: string[] }) => {
        calls.push({ command: options.command, args: options.args });
        const commandLine = options.args.join(" ");

        if (commandLine.includes("Set-Service")) {
          return {
            ok: false,
            code: 1,
            stdout: "",
            stderr: "Acceso denegado",
            message: "failed",
          };
        }

        if (commandLine.includes("Get-Service -Name 'com.docker.service'")) {
          return {
            ok: true,
            code: 0,
            stdout: "Stopped",
            stderr: "",
            message: "ok",
          };
        }

        if (options.args[0] === "info") {
          return {
            ok: true,
            code: 0,
            stdout: "29.4.0",
            stderr: "",
            message: "ok",
          };
        }

        return { ok: true, code: 0, stdout: "", stderr: "", message: "ok" };
      },
    };

    const pathResolver = {
      getProjectRoot: () => process.cwd(),
    };

    const service = new DockerOrchestratorService(
      pathResolver as PathResolverService,
      processRunner as ProcessRunnerService,
      { dockerStartupWaitMs: 0, dockerStartupPollMs: 0 },
    );

    const result = await service.startStack(runtimePath);

    expect(result.ok).toBe(true);
    expect(
      calls.some(
        (call) => call.args.includes("compose") && call.args.includes("up"),
      ),
    ).toBe(true);
  });

  it("fuerza migraciones de arranque en comandos up de producción", async () => {
    const runtimePath = await createFakeRuntime();
    const processRunner = {
      run: async (options: { args: string[]; env?: NodeJS.ProcessEnv }) => {
        const commandLine = options.args.join(" ");

        if (commandLine.includes("Get-Service -Name 'com.docker.service'")) {
          return {
            ok: true,
            code: 0,
            stdout: "Running",
            stderr: "",
            message: "ok",
          };
        }

        if (options.args[0] === "info") {
          return {
            ok: true,
            code: 0,
            stdout: "29.4.0",
            stderr: "",
            message: "ok",
          };
        }

        if (options.args.includes("up")) {
          expect(options.env?.STARTUP_RUN_MIGRATIONS).toBe("true");
        }

        return { ok: true, code: 0, stdout: "", stderr: "", message: "ok" };
      },
    };

    const pathResolver = {
      getProjectRoot: () => process.cwd(),
    };

    const service = new DockerOrchestratorService(
      pathResolver as PathResolverService,
      processRunner as ProcessRunnerService,
    );

    const result = await service.startStack(runtimePath);

    expect(result.ok).toBe(true);
  });

  it("recupera Docker Desktop abierto con distro docker-desktop detenida antes de desplegar", async () => {
    const runtimePath = await createFakeRuntime();
    const calls: Array<{ command: string; args: string[] }> = [];
    let dockerReady = false;

    const processRunner = {
      run: async (options: { command: string; args: string[] }) => {
        calls.push({ command: options.command, args: options.args });
        const commandLine = options.args.join(" ");

        if (commandLine.includes("Get-Service -Name 'com.docker.service'")) {
          return {
            ok: true,
            code: 0,
            stdout: "Running",
            stderr: "",
            message: "ok",
          };
        }

        if (commandLine.includes("-SwitchLinuxEngine")) {
          dockerReady = true;
          return { ok: true, code: 0, stdout: "", stderr: "", message: "ok" };
        }

        if (
          options.command === "wsl" ||
          (options.command === "powershell" &&
            commandLine.includes("Get-ChildItem -Path"))
        ) {
          return {
            ok: true,
            code: 0,
            stdout:
              options.command === "wsl"
                ? "docker-desktop Stopped 2"
                : "dockerBackendV2",
            stderr: "",
            message: "ok",
          };
        }

        if (options.args[0] === "context" && options.args[1] === "ls") {
          return {
            ok: true,
            code: 0,
            stdout: "desktop-linux",
            stderr: "",
            message: "ok",
          };
        }

        if (options.args.includes("info")) {
          return dockerReady
            ? {
                ok: true,
                code: 0,
                stdout: "29.4.0",
                stderr: "",
                message: "ok",
              }
            : {
                ok: false,
                code: 1,
                stdout: "",
                stderr: "open //./pipe/dockerDesktopLinuxEngine",
                message: "failed",
              };
        }

        return { ok: true, code: 0, stdout: "", stderr: "", message: "ok" };
      },
    };

    const pathResolver = {
      getProjectRoot: () => process.cwd(),
    };

    const service = new DockerOrchestratorService(
      pathResolver as PathResolverService,
      processRunner as ProcessRunnerService,
      { dockerStartupWaitMs: 1, dockerStartupPollMs: 0 },
    );

    const result = await service.startStack(runtimePath);

    expect(result.ok).toBe(true);
    expect(
      calls.some((call) => call.args.join(" ").includes("-SwitchLinuxEngine")),
    ).toBe(true);
    expect(
      calls.some(
        (call) => call.args.includes("compose") && call.args.includes("up"),
      ),
    ).toBe(true);
  });

  it("devuelve error claro si no logra recuperar daemon/contexto", async () => {
    const runtimePath = await createFakeRuntime();
    const processRunner = {
      run: async () => ({
        ok: false,
        code: 1,
        stdout: "",
        stderr: "daemon unavailable",
        message: "failed",
      }),
    };
    const pathResolver = {
      getProjectRoot: () => process.cwd(),
    };

    const service = new DockerOrchestratorService(
      pathResolver as PathResolverService,
      processRunner as ProcessRunnerService,
      { dockerStartupWaitMs: 0, dockerStartupPollMs: 0 },
    );

    const result = await service.startStack(runtimePath);

    expect(result.ok).toBe(false);
    expect(result.message).toContain(
      "Docker daemon no disponible tras reintentos de contexto/servicio",
    );
  });
});

async function createFakeRuntime(): Promise<string> {
  const runtimePath = await fs.mkdtemp(path.join(os.tmpdir(), "se-runtime-"));
  await fs.writeFile(path.join(runtimePath, ".env.prod"), "A=B\n", "utf8");
  await fs.mkdir(path.join(runtimePath, "project", "backend"), {
    recursive: true,
  });
  await fs.mkdir(path.join(runtimePath, "project", "frontend"), {
    recursive: true,
  });
  await fs.mkdir(path.join(runtimePath, "project", "database"), {
    recursive: true,
  });
  await fs.writeFile(
    path.join(runtimePath, "project", "docker-compose.prod.yml"),
    "services:\n  backend:\n    image: busybox\n",
    "utf8",
  );
  return runtimePath;
}
