import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  resolveInstallerScriptsRoot,
  resolveTemplatesRoot,
} from "../path-resolver.service";

describe("PathResolverService helpers", () => {
  it("prioriza templates extraídos fuera del asar en build empaquetado", () => {
    const appPath = path.join("/opt", "SmartEconomat", "resources", "app.asar");
    const resourcesPath = path.join("/opt", "SmartEconomat", "resources");

    const resolved = resolveTemplatesRoot({
      appPath,
      resourcesPath,
      isPackaged: true,
      exists: (candidatePath) =>
        candidatePath === path.join(resourcesPath, "templates"),
    });

    expect(resolved).toBe(path.join(resourcesPath, "templates"));
  });

  it("usa fallback al bundle cuando templates externos aún no existen", () => {
    const appPath = path.join("/opt", "SmartEconomat", "resources", "app.asar");
    const resourcesPath = path.join("/opt", "SmartEconomat", "resources");
    const bundleTemplatesPath = path.join(appPath, "resources", "templates");

    const resolved = resolveTemplatesRoot({
      appPath,
      resourcesPath,
      isPackaged: true,
      exists: (candidatePath) => candidatePath === bundleTemplatesPath,
    });

    expect(resolved).toBe(bundleTemplatesPath);
  });

  it("resuelve scripts externos empaquetados para ejecución nativa", () => {
    const appPath = path.join("/opt", "SmartEconomat", "resources", "app.asar");
    const resourcesPath = path.join("/opt", "SmartEconomat", "resources");

    const resolved = resolveInstallerScriptsRoot({
      appPath,
      resourcesPath,
      isPackaged: true,
      exists: (candidatePath) =>
        candidatePath === path.join(resourcesPath, "scripts"),
    });

    expect(resolved).toBe(path.join(resourcesPath, "scripts"));
  });

  it("mantiene rutas de desarrollo sin depender de resourcesPath", () => {
    const appPath = "/workspace/ElectronInstaller";

    expect(
      resolveTemplatesRoot({
        appPath,
        resourcesPath: "/unused",
        isPackaged: false,
      }),
    ).toBe(path.join(appPath, "resources", "templates"));

    expect(
      resolveInstallerScriptsRoot({
        appPath,
        resourcesPath: "/unused",
        isPackaged: false,
      }),
    ).toBe(path.join(appPath, "scripts"));
  });
});
