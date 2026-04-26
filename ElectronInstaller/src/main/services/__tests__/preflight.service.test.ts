import { describe, expect, it } from "vitest";

import type { CommandResult } from "@shared/contracts";

import {
  downgradeWindowsDockerDesktopChecks,
  evaluateDockerChecks,
} from "../preflight.service";

function commandResult(
  ok: boolean,
  stdout: string,
  stderr: string,
): CommandResult {
  return {
    ok,
    code: ok ? 0 : 1,
    stdout,
    stderr,
    message: ok ? "ok" : "fail",
  };
}

describe("evaluateDockerChecks", () => {
  it("marca checks en OK cuando docker y compose responden", () => {
    const checks = evaluateDockerChecks(
      commandResult(true, "26.1.1", ""),
      commandResult(true, "Docker Compose version v2.30.0", ""),
    );

    expect(checks).toHaveLength(2);
    expect(checks[0]?.status).toBe("OK");
    expect(checks[1]?.status).toBe("OK");
  });

  it("marca BLOCKER cuando docker falla", () => {
    const checks = evaluateDockerChecks(
      commandResult(false, "", "daemon not running"),
      commandResult(true, "Docker Compose version v2.30.0", ""),
    );

    expect(checks[0]?.status).toBe("BLOCKER");
    expect(checks[1]?.status).toBe("OK");
  });

  it("marca WARN cuando docker devuelve timeout", () => {
    const checks = evaluateDockerChecks(
      commandResult(false, "", "Command timed out"),
      commandResult(true, "Docker Compose version v2.30.0", ""),
    );

    expect(checks[0]?.status).toBe("WARN");
    expect(checks[0]?.detail).toContain("excedió el tiempo de espera");
    expect(checks[0]?.recommendation).toContain("vuelve a ejecutar preflight");
  });

  it("normaliza error de pipe dockerDesktopLinuxEngine en mensaje amigable", () => {
    const checks = evaluateDockerChecks(
      commandResult(
        false,
        "",
        "failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine; open //./pipe/dockerDesktopLinuxEngine: El sistema no puede encontrar el archivo especificado.",
      ),
      commandResult(true, "Docker Compose version v2.30.0", ""),
    );

    expect(checks[0]?.status).toBe("BLOCKER");
    expect(checks[0]?.detail).toContain("daemon Linux no está disponible");
    expect(checks[0]?.recommendation).toContain(
      "Inicia o reinicia Docker Desktop",
    );
  });
});

describe("downgradeWindowsDockerDesktopChecks", () => {
  it("degrada checks de Docker Desktop a WARN cuando docker y compose funcionan", () => {
    const checks = downgradeWindowsDockerDesktopChecks(
      [
        {
          id: "wsl2",
          label: "WSL2",
          status: "BLOCKER",
          detail: "WSL2 no disponible.",
          repairable: true,
          repairAction: "auto-repair",
          repairHint: "Intentará instalar WSL2 automáticamente.",
        },
        {
          id: "docker-desktop-installed",
          label: "Docker Desktop instalado",
          status: "BLOCKER",
          detail: "No se encontró Docker Desktop.",
          repairable: true,
          repairAction: "auto-repair",
          repairHint: "Intentará instalar Docker Desktop con winget.",
        },
        {
          id: "docker-desktop-running",
          label: "Docker Desktop en ejecución",
          status: "BLOCKER",
          detail: "Docker Desktop no está iniciado.",
          repairable: true,
          repairAction: "auto-repair",
          repairHint: "Intentará iniciar Docker Desktop automáticamente.",
        },
      ],
      commandResult(true, "26.1.1", ""),
      commandResult(true, "Docker Compose version v2.30.0", ""),
      "win32",
    );

    expect(checks).toHaveLength(3);
    expect(checks[0]?.status).toBe("WARN");
    expect(checks[0]?.repairable).toBe(false);
    expect(checks[0]?.repairAction).toBeUndefined();
    expect(checks[0]?.repairHint).toBeUndefined();
    expect(checks[0]?.detail).toContain("Docker está operativo");

    expect(checks[1]?.status).toBe("WARN");
    expect(checks[1]?.repairable).toBe(false);
    expect(checks[1]?.repairAction).toBeUndefined();

    expect(checks[2]?.status).toBe("WARN");
    expect(checks[2]?.repairable).toBe(false);
    expect(checks[2]?.repairAction).toBeUndefined();
  });

  it("mantiene el bloqueo cuando docker falla", () => {
    const originalChecks = [
      {
        id: "docker-desktop-installed",
        label: "Docker Desktop instalado",
        status: "BLOCKER" as const,
        detail: "No se encontró Docker Desktop.",
        repairable: true,
        repairAction: "auto-repair" as const,
        repairHint: "Intentará instalar Docker Desktop con winget.",
      },
    ];

    const checks = downgradeWindowsDockerDesktopChecks(
      originalChecks,
      commandResult(false, "", "daemon not running"),
      commandResult(true, "Docker Compose version v2.30.0", ""),
      "win32",
    );

    expect(checks[0]?.status).toBe("BLOCKER");
    expect(checks[0]?.repairable).toBe(true);
    expect(checks[0]?.repairAction).toBe("auto-repair");
  });

  it("mantiene el bloqueo cuando compose falla", () => {
    const originalChecks = [
      {
        id: "docker-desktop-running",
        label: "Docker Desktop en ejecución",
        status: "BLOCKER" as const,
        detail: "Docker Desktop no está iniciado.",
        repairable: true,
        repairAction: "auto-repair" as const,
        repairHint: "Intentará iniciar Docker Desktop automáticamente.",
      },
    ];

    const checks = downgradeWindowsDockerDesktopChecks(
      originalChecks,
      commandResult(true, "26.1.1", ""),
      commandResult(false, "", "compose not found"),
      "win32",
    );

    expect(checks[0]?.status).toBe("BLOCKER");
    expect(checks[0]?.repairable).toBe(true);
    expect(checks[0]?.repairAction).toBe("auto-repair");
  });

  it("no cambia nada fuera de Windows", () => {
    const checks = downgradeWindowsDockerDesktopChecks(
      [
        {
          id: "docker-desktop-installed",
          label: "Docker Desktop instalado",
          status: "BLOCKER" as const,
          detail: "No se encontró Docker Desktop.",
          repairable: true,
          repairAction: "auto-repair" as const,
          repairHint: "Intentará instalar Docker Desktop con winget.",
        },
      ],
      commandResult(true, "26.1.1", ""),
      commandResult(true, "Docker Compose version v2.30.0", ""),
      "linux",
    );

    expect(checks[0]?.status).toBe("BLOCKER");
    expect(checks[0]?.repairable).toBe(true);
    expect(checks[0]?.repairAction).toBe("auto-repair");
  });
});
