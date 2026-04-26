import { describe, expect, it } from "vitest";

import { parseWindowsDockerDesktopResolveStdout } from "../docker-desktop-windows-resolve";

describe("parseWindowsDockerDesktopResolveStdout", () => {
  it("parsea FOUND con ruta en segunda línea", () => {
    const { found, exePath } = parseWindowsDockerDesktopResolveStdout(
      "FOUND\r\nC:\\Users\\x\\AppData\\Local\\Programs\\Docker\\Docker\\Docker Desktop.exe\r\n",
    );
    expect(found).toBe(true);
    expect(exePath).toBe(
      "C:\\Users\\x\\AppData\\Local\\Programs\\Docker\\Docker\\Docker Desktop.exe",
    );
  });

  it("devuelve not found cuando falta ruta", () => {
    const { found, exePath } = parseWindowsDockerDesktopResolveStdout("FOUND");
    expect(found).toBe(false);
    expect(exePath).toBeNull();
  });

  it("parsea NOTFOUND", () => {
    const { found, exePath } = parseWindowsDockerDesktopResolveStdout(
      "NOTFOUND\n",
    );
    expect(found).toBe(false);
    expect(exePath).toBeNull();
  });
});
