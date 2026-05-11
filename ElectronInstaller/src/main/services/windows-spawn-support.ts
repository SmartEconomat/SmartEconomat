import fs from "node:fs";
import path from "node:path";

/**
 * Rutas y variables de entorno mínimas para que `child_process.spawn` sea fiable
 * en el proceso principal de Electron en Windows (PATH a menudo incompleto).
 *
 * @see https://github.com/nodejs/node/issues — fallos de CreateProcessW se exponen
 * a veces como `spawn UNKNOWN` cuando el ejecutable no se resuelve vía PATH.
 */

export function getWindowsSystemRoot(): string {
  const root = process.env.SystemRoot ?? process.env.windir ?? "C:\\Windows";
  return path.normalize(root);
}

function powershellCandidatePaths(): string[] {
  const systemRoot = getWindowsSystemRoot();
  return [
    path.join(
      systemRoot,
      "System32",
      "WindowsPowerShell",
      "v1.0",
      "powershell.exe",
    ),
    path.join(
      systemRoot,
      "SysWOW64",
      "WindowsPowerShell",
      "v1.0",
      "powershell.exe",
    ),
  ];
}

/**
 * Resuelve la ruta canónica de powershell.exe (sin depender del PATH del proceso padre).
 */
export function tryResolveWindowsPowerShellExecutable(): string | null {
  if (process.platform !== "win32") {
    return null;
  }

  for (const candidate of powershellCandidatePaths()) {
    try {
      fs.accessSync(candidate, fs.constants.F_OK);
      return candidate;
    } catch {
      // Sigue con el siguiente candidato.
    }
  }

  return null;
}

function tryResolveWindowsWslExecutable(): string | null {
  if (process.platform !== "win32") {
    return null;
  }

  const candidate = path.join(getWindowsSystemRoot(), "System32", "wsl.exe");
  try {
    fs.accessSync(candidate, fs.constants.F_OK);
    return candidate;
  } catch {
    return null;
  }
}

function tryResolveWindowsCmdExecutable(): string | null {
  if (process.platform !== "win32") {
    return null;
  }

  const candidate = path.join(getWindowsSystemRoot(), "System32", "cmd.exe");
  try {
    fs.accessSync(candidate, fs.constants.F_OK);
    return candidate;
  } catch {
    return null;
  }
}

/**
 * Sustituye nombres cortos de binarios críticos por rutas absolutas cuando sea posible.
 */
export function normalizeWindowsSpawnCommand(command: string): string {
  if (process.platform !== "win32") {
    return command;
  }

  const trimmed = command.trim();
  if (trimmed.length === 0) {
    return command;
  }

  if (trimmed.includes(path.sep) || trimmed.includes("/")) {
    return command;
  }

  const base = path.basename(trimmed, path.extname(trimmed)).toLowerCase();
  const ext = path.extname(trimmed).toLowerCase();

  if (base === "powershell" && (ext === "" || ext === ".exe")) {
    return tryResolveWindowsPowerShellExecutable() ?? command;
  }

  if (base === "wsl" && (ext === "" || ext === ".exe")) {
    return tryResolveWindowsWslExecutable() ?? command;
  }

  if (base === "cmd" && (ext === "" || ext === ".exe")) {
    return tryResolveWindowsCmdExecutable() ?? command;
  }

  return command;
}

function getPathKeys(env: NodeJS.ProcessEnv): string[] {
  return Object.keys(env).filter((key) => key.toUpperCase() === "PATH");
}

/**
 * Antepone entradas esenciales de Windows al PATH para resolución de `docker.exe`,
 * `where.exe`, `wsl.exe`, etc., cuando el padre (Electron) arranca con PATH mínimo.
 */
export function mergeWindowsEssentialPathEntries(
  env: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv {
  if (process.platform !== "win32") {
    return { ...env };
  }

  const systemRoot = getWindowsSystemRoot();
  const additions = [
    path.join(systemRoot, "System32"),
    path.join(systemRoot, "SysWOW64"),
    systemRoot,
  ];

  const next = { ...env };
  const pathKeys = getPathKeys(next);
  const primaryKey = pathKeys.includes("Path") ? "Path" : "PATH";
  const raw =
    next[primaryKey] ??
    next.PATH ??
    next.Path ??
    process.env.PATH ??
    process.env.Path ??
    "";

  const existing = raw
    .split(path.delimiter)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  const merged: string[] = [];
  for (const dir of additions) {
    if (!existing.includes(dir) && !merged.includes(dir)) {
      merged.push(dir);
    }
  }
  merged.push(...existing);

  const joined = merged.join(path.delimiter);
  next.PATH = joined;
  next.Path = joined;

  return next;
}

/**
 * Antepone un directorio al PATH (p. ej. carpeta de `docker.exe`).
 */
/**
 * Si `docker.exe` está en las rutas típicas de Docker Desktop, antepone ese directorio al PATH.
 * Útil cuando el proceso padre no tiene PATH completo pero Docker está instalado en Program Files.
 */
export function prependKnownDockerCliBinsOnPath(
  env: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv {
  if (process.platform !== "win32") {
    return env;
  }

  const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";
  const programFilesX86 =
    process.env["ProgramFiles(x86)"] ??
    path.join(programFiles, "..", "Program Files (x86)");

  const candidateDirs = [
    path.join(programFiles, "Docker", "Docker", "resources", "bin"),
    path.join(programFiles, "Docker", "Docker", "resources"),
    path.join(programFilesX86, "Docker", "Docker", "resources", "bin"),
    path.join(programFilesX86, "Docker", "Docker", "resources"),
  ];

  for (const directory of candidateDirs) {
    const dockerExe = path.join(directory, "docker.exe");
    try {
      fs.accessSync(dockerExe, fs.constants.F_OK);
      return prependPathDirectory(env, directory);
    } catch {
      // Sigue con el siguiente directorio.
    }
  }

  return env;
}

export function prependPathDirectory(
  env: NodeJS.ProcessEnv,
  directory: string,
): NodeJS.ProcessEnv {
  const next = { ...env };
  const normalized = path.normalize(directory);
  const raw =
    next.PATH ?? next.Path ?? process.env.PATH ?? process.env.Path ?? "";

  const segments = raw
    .split(path.delimiter)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const filtered = segments.filter(
    (segment) => path.normalize(segment) !== normalized,
  );
  const joined = [normalized, ...filtered].join(path.delimiter);
  next.PATH = joined;
  next.Path = joined;
  return next;
}

export function formatChildProcessSpawnError(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const enriched = error as NodeJS.ErrnoException & {
    syscall?: string;
    path?: string;
    spawnargs?: string[];
  };

  const segments = [
    enriched.message,
    enriched.code ? `code=${enriched.code}` : "",
    enriched.errno !== undefined ? `errno=${String(enriched.errno)}` : "",
    enriched.syscall ? `syscall=${enriched.syscall}` : "",
    enriched.path ? `path=${enriched.path}` : "",
  ].filter((segment) => segment.length > 0);

  const base = segments.join(" | ");

  if (enriched.cause instanceof Error) {
    return `${base} | cause=${enriched.cause.message}`;
  }

  return base;
}
