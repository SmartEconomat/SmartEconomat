import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  formatChildProcessSpawnError,
  mergeWindowsEssentialPathEntries,
  normalizeWindowsSpawnCommand,
  prependKnownDockerCliBinsOnPath,
  prependPathDirectory,
} from "../windows-spawn-support";

describe("normalizeWindowsSpawnCommand", () => {
  it("en plataformas no Windows devuelve el comando sin cambios", () => {
    if (process.platform === "win32") {
      expect(normalizeWindowsSpawnCommand("powershell")).toMatch(/powershell/i);
      return;
    }
    expect(normalizeWindowsSpawnCommand("powershell")).toBe("powershell");
    expect(normalizeWindowsSpawnCommand("C:\\foo\\bar.exe")).toBe(
      "C:\\foo\\bar.exe",
    );
  });
});

describe("mergeWindowsEssentialPathEntries", () => {
  it("fuera de Windows devuelve una copia superficial del entorno", () => {
    if (process.platform === "win32") {
      return;
    }
    const base = { FOO: "1", PATH: "/usr/bin" };
    const merged = mergeWindowsEssentialPathEntries(base);
    expect(merged).not.toBe(base);
    expect(merged.FOO).toBe("1");
    expect(merged.PATH).toBe("/usr/bin");
  });
});

describe("prependPathDirectory", () => {
  it("inserta el directorio al inicio del PATH", () => {
    const d = path.delimiter;
    const env = prependPathDirectory({ PATH: `b${d}c` }, "a");
    expect(env.PATH).toBe(`a${d}b${d}c`);
    expect(env.Path).toBe(env.PATH);
  });
});

describe("prependKnownDockerCliBinsOnPath", () => {
  it("fuera de Windows no modifica el entorno", () => {
    if (process.platform === "win32") {
      return;
    }
    const env = { PATH: "/x" };
    expect(prependKnownDockerCliBinsOnPath(env)).toBe(env);
  });
});

describe("formatChildProcessSpawnError", () => {
  it("incluye code y syscall cuando existen", () => {
    const err = Object.assign(new Error("spawn UNKNOWN"), {
      code: "UNKNOWN",
      errno: -4094,
      syscall: "spawn",
      path: "docker",
    }) as NodeJS.ErrnoException;
    const text = formatChildProcessSpawnError(err);
    expect(text).toContain("spawn UNKNOWN");
    expect(text).toContain("code=UNKNOWN");
    expect(text).toContain("syscall=spawn");
    expect(text).toContain("path=docker");
  });

  it("serializa valores no Error", () => {
    expect(formatChildProcessSpawnError(42)).toBe("42");
  });
});
