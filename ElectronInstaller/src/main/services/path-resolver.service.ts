import fs from "node:fs";
import path from "node:path";

import { app } from "electron";

type ExistsFn = (candidatePath: string) => boolean;

interface ResolverContext {
  appPath: string;
  resourcesPath: string;
  isPackaged: boolean;
  exists?: ExistsFn;
}

function pickExistingPath(
  candidates: string[],
  exists: ExistsFn = fs.existsSync,
): string {
  for (const candidate of candidates) {
    if (exists(candidate)) {
      return candidate;
    }
  }

  return candidates[0] ?? "";
}

export function resolveTemplatesRoot(context: ResolverContext): string {
  const candidates = context.isPackaged
    ? [
        path.join(context.resourcesPath, "templates"),
        path.join(context.resourcesPath, "resources", "templates"),
        path.join(context.appPath, "resources", "templates"),
      ]
    : [
        path.join(context.appPath, "resources", "templates"),
        path.join(process.cwd(), "resources", "templates"),
        path.join(process.cwd(), "ElectronInstaller", "resources", "templates"),
        path.resolve(context.appPath, "..", "resources", "templates"),
        path.resolve(context.appPath, "..", "..", "resources", "templates"),
      ];

  if (!context.isPackaged && !context.exists) {
    return candidates[0] ?? "";
  }

  return pickExistingPath(candidates, context.exists);
}

export function resolveInstallerScriptsRoot(context: ResolverContext): string {
  const candidates = context.isPackaged
    ? [
        path.join(context.resourcesPath, "scripts"),
        path.join(context.resourcesPath, "app.asar.unpacked", "scripts"),
        path.join(context.resourcesPath, "resources", "scripts"),
      ]
    : [
        path.join(context.appPath, "scripts"),
        path.join(process.cwd(), "scripts"),
        path.join(process.cwd(), "ElectronInstaller", "scripts"),
        path.resolve(context.appPath, "..", "scripts"),
        path.resolve(context.appPath, "..", "..", "scripts"),
      ];

  if (!context.isPackaged && !context.exists) {
    return candidates[0] ?? "";
  }

  return pickExistingPath(candidates, context.exists);
}

export class PathResolverService {
  getInstallerRoot(): string {
    return app.isPackaged ? process.resourcesPath : app.getAppPath();
  }

  getProjectRoot(): string {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, "project");
    }
    return path.resolve(this.getInstallerRoot(), "..");
  }

  getTemplatesRoot(): string {
    return resolveTemplatesRoot({
      appPath: app.getAppPath(),
      resourcesPath: process.resourcesPath,
      isPackaged: app.isPackaged,
    });
  }

  getInstallerScriptsRoot(): string {
    return resolveInstallerScriptsRoot({
      appPath: app.getAppPath(),
      resourcesPath: process.resourcesPath,
      isPackaged: app.isPackaged,
    });
  }

  getRuntimeFile(runtimePath: string, fileName: string): string {
    return path.join(runtimePath, fileName);
  }
}
