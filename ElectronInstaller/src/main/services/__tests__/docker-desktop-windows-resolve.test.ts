import { describe, expect, it } from "vitest";

import {
  buildWindowsDockerCliResolveCommand,
  buildWindowsDockerDesktopResolveCommand,
  parseWindowsDockerDesktopResolveStdout,
} from "../docker-desktop-windows-resolve";

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

describe("windows docker resolve commands", () => {
  it("incluye fallback por proceso para Docker Desktop.exe", () => {
    const command = buildWindowsDockerDesktopResolveCommand();
    expect(command).toContain("frontend\\Docker Desktop.exe");
    expect(command).toContain("Get-Process -Name 'Docker Desktop'");
    expect(command).toContain("Get-Process -Name 'com.docker.backend'");
  });

  it("incluye fallback por where.exe y servicio com.docker.service para docker.exe", () => {
    const command = buildWindowsDockerCliResolveCommand();
    expect(command).toContain("where.exe docker");
    expect(command).toContain("Name='com.docker.service'");
    expect(command).toContain("Get-Process -Name 'Docker Desktop'");
  });
});
