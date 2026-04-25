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
  if (!context.isPackaged) {
    return path.join(context.appPath, "resources", "templates");
  }

  return pickExistingPath(
    [
      path.join(context.resourcesPath, "templates"),
      path.join(context.resourcesPath, "resources", "templates"),
      path.join(context.appPath, "resources", "templates"),
    ],
    context.exists,
  );
}

export function resolveInstallerScriptsRoot(context: ResolverContext): string {
  if (!context.isPackaged) {
    return path.join(context.appPath, "scripts");
  }

  return pickExistingPath(
    [
      path.join(context.resourcesPath, "scripts"),
      path.join(context.resourcesPath, "app.asar.unpacked", "scripts"),
      path.join(context.resourcesPath, "resources", "scripts"),
    ],
    context.exists,
  );
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
