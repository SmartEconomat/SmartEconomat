import fs from "node:fs/promises";

import type { ProcessRunnerService } from "./process-runner.service";

const PROGRAM_FILES_DOCKER_ROOT = "C:\\Program Files\\Docker\\Docker";
const PROGRAM_FILES_X86_DOCKER_ROOT = "C:\\Program Files (x86)\\Docker\\Docker";

const dockerDesktopExeCandidates = [
  `${PROGRAM_FILES_DOCKER_ROOT}\\frontend\\Docker Desktop.exe`,
  `${PROGRAM_FILES_DOCKER_ROOT}\\Docker Desktop.exe`,
  `${PROGRAM_FILES_X86_DOCKER_ROOT}\\frontend\\Docker Desktop.exe`,
  `${PROGRAM_FILES_X86_DOCKER_ROOT}\\Docker Desktop.exe`,
];

const dockerCliCandidates = [
  `${PROGRAM_FILES_DOCKER_ROOT}\\resources\\bin\\docker.exe`,
  `${PROGRAM_FILES_DOCKER_ROOT}\\resources\\docker.exe`,
  `${PROGRAM_FILES_X86_DOCKER_ROOT}\\resources\\bin\\docker.exe`,
  `${PROGRAM_FILES_X86_DOCKER_ROOT}\\resources\\docker.exe`,
];

async function firstExistingPath(candidates: string[]): Promise<string | null> {
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Sigue probando rutas conocidas.
    }
  }

  return null;
}

/**
 * Construye windows docker desktop resolve command a partir de los parámetros recibidos.
 * @returns Valor resultante de la operación.
 */
/**
 * Expone la operación "buildWindowsDockerDesktopResolveCommand" del instalador SmartEconomat.
 * @returns {string} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function buildWindowsDockerDesktopResolveCommand(): string {
  return [
    "$ErrorActionPreference = 'SilentlyContinue'",
    "$candidates = @(",
    "  (Join-Path $env:ProgramFiles 'Docker\\Docker\\frontend\\Docker Desktop.exe'),",
    "  (Join-Path $env:ProgramFiles 'Docker\\Docker\\Docker Desktop.exe'),",
    "  (Join-Path $env:LocalAppData 'Programs\\Docker\\Docker\\frontend\\Docker Desktop.exe'),",
    "  (Join-Path $env:LocalAppData 'Programs\\Docker\\Docker\\Docker Desktop.exe')",
    ")",
    "$pfx86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')",
    "if ($pfx86) {",
    "  $candidates += (Join-Path $pfx86 'Docker\\Docker\\frontend\\Docker Desktop.exe')",
    "  $candidates += (Join-Path $pfx86 'Docker\\Docker\\Docker Desktop.exe')",
    "}",
    "foreach ($p in $candidates) {",
    "  if ($p -and (Test-Path -LiteralPath $p)) {",
    "    Write-Output 'FOUND'",
    "    Write-Output $p",
    "    exit 0",
    "  }",
    "}",
    "$desktopProc = Get-Process -Name 'Docker Desktop' -ErrorAction SilentlyContinue | Select-Object -First 1",
    "if ($desktopProc -and $desktopProc.Path -and (Test-Path -LiteralPath $desktopProc.Path)) {",
    "  Write-Output 'FOUND'",
    "  Write-Output $desktopProc.Path",
    "  exit 0",
    "}",
    "$backendProc = Get-Process -Name 'com.docker.backend' -ErrorAction SilentlyContinue | Select-Object -First 1",
    "if ($backendProc -and $backendProc.Path) {",
    "  $backendDir = Split-Path -Parent $backendProc.Path",
    "  $desktopFromBackend = Join-Path $backendDir 'Docker Desktop.exe'",
    "  if (Test-Path -LiteralPath $desktopFromBackend) {",
    "    Write-Output 'FOUND'",
    "    Write-Output $desktopFromBackend",
    "    exit 0",
    "  }",
    "}",
    "$rootDirs = @(",
    "  'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',",
    "  'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',",
    "  'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall'",
    ")",
    "foreach ($dir in $rootDirs) {",
    "  if (-not (Test-Path -LiteralPath $dir)) { continue }",
    "  Get-ChildItem -LiteralPath $dir -ErrorAction SilentlyContinue | ForEach-Object {",
    "    $app = Get-ItemProperty -LiteralPath $_.PSPath -ErrorAction SilentlyContinue",
    "    if (-not $app -or $null -eq $app.DisplayName -or $app.DisplayName -notlike '*Docker Desktop*') { return }",
    "    if ($app.DisplayIcon) {",
    "      $icon = ($app.DisplayIcon -split ',')[0].Trim().TrimStart([char]34).TrimEnd([char]34)",
    "      if ($icon -and (Test-Path -LiteralPath $icon)) {",
    "        Write-Output 'FOUND'",
    "        Write-Output $icon",
    "        exit 0",
    "      }",
    "    }",
    "    if ($app.InstallLocation) {",
    "      $guessFrontend = Join-Path $app.InstallLocation 'frontend\\Docker Desktop.exe'",
    "      if (Test-Path -LiteralPath $guessFrontend) {",
    "        Write-Output 'FOUND'",
    "        Write-Output $guessFrontend",
    "        exit 0",
    "      }",
    "      $guess = Join-Path $app.InstallLocation 'Docker Desktop.exe'",
    "      if (Test-Path -LiteralPath $guess) {",
    "        Write-Output 'FOUND'",
    "        Write-Output $guess",
    "        exit 0",
    "      }",
    "    }",
    "  }",
    "}",
    "Write-Output 'NOTFOUND'",
  ].join(" ");
}

/**
 * Construye windows docker cli resolve command a partir de los parámetros recibidos.
 * @returns Valor resultante de la operación.
 */
/**
 * Expone la operación "buildWindowsDockerCliResolveCommand" del instalador SmartEconomat.
 * @returns {string} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function buildWindowsDockerCliResolveCommand(): string {
  return [
    "$ErrorActionPreference = 'SilentlyContinue'",
    "$candidates = @()",
    "$cmd = Get-Command docker.exe -ErrorAction SilentlyContinue",
    "if ($cmd -and $cmd.Source) { $candidates += $cmd.Source }",
    "$cmdPlain = Get-Command docker -ErrorAction SilentlyContinue",
    "if ($cmdPlain -and $cmdPlain.Source) { $candidates += $cmdPlain.Source }",
    "$whereDocker = & where.exe docker 2>$null",
    "if ($whereDocker) {",
    "  $whereDocker | ForEach-Object { if ($_ -and (Test-Path -LiteralPath $_)) { $candidates += $_ } }",
    "}",
    "$candidates += (Join-Path $env:ProgramFiles 'Docker\\Docker\\resources\\bin\\docker.exe')",
    "$candidates += (Join-Path $env:ProgramFiles 'Docker\\Docker\\resources\\docker.exe')",
    "$candidates += (Join-Path $env:LocalAppData 'Programs\\Docker\\Docker\\resources\\bin\\docker.exe')",
    "$pfx86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')",
    "if ($pfx86) { $candidates += (Join-Path $pfx86 'Docker\\Docker\\resources\\bin\\docker.exe') }",
    "$desktopProc = Get-Process -Name 'Docker Desktop' -ErrorAction SilentlyContinue | Select-Object -First 1",
    "if ($desktopProc -and $desktopProc.Path) {",
    "  $desktopDir = Split-Path -Parent $desktopProc.Path",
    "  $candidates += (Join-Path $desktopDir 'resources\\bin\\docker.exe')",
    "  $candidates += (Join-Path $desktopDir 'resources\\docker.exe')",
    "}",
    "$backendProc = Get-Process -Name 'com.docker.backend' -ErrorAction SilentlyContinue | Select-Object -First 1",
    "if ($backendProc -and $backendProc.Path) {",
    "  $backendDir = Split-Path -Parent $backendProc.Path",
    "  $candidates += (Join-Path $backendDir 'docker.exe')",
    "  $candidates += (Join-Path $backendDir 'resources\\bin\\docker.exe')",
    "}",
    "$service = Get-CimInstance Win32_Service -Filter \"Name='com.docker.service'\" -ErrorAction SilentlyContinue",
    "if ($service -and $service.PathName) {",
    "  $svcExe = ($service.PathName -replace '^\\\"|\\\"$','') -split '\\s+' | Select-Object -First 1",
    "  if ($svcExe) {",
    "    $svcDir = Split-Path -Parent $svcExe",
    "    $candidates += (Join-Path $svcDir 'resources\\bin\\docker.exe')",
    "    $candidates += (Join-Path $svcDir 'docker.exe')",
    "  }",
    "}",
    "$rootDirs = @(",
    "  'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',",
    "  'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',",
    "  'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall'",
    ")",
    "foreach ($dir in $rootDirs) {",
    "  if (-not (Test-Path -LiteralPath $dir)) { continue }",
    "  Get-ChildItem -LiteralPath $dir -ErrorAction SilentlyContinue | ForEach-Object {",
    "    $app = Get-ItemProperty -LiteralPath $_.PSPath -ErrorAction SilentlyContinue",
    "    if (-not $app -or $null -eq $app.DisplayName -or $app.DisplayName -notlike '*Docker Desktop*') { return }",
    "    if ($app.InstallLocation) {",
    "      $candidates += (Join-Path $app.InstallLocation 'resources\\bin\\docker.exe')",
    "    }",
    "  }",
    "}",
    "foreach ($p in $candidates) {",
    "  if ($p -and (Test-Path -LiteralPath $p)) {",
    "    Write-Output 'FOUND'",
    "    Write-Output $p",
    "    exit 0",
    "  }",
    "}",
    "Write-Output 'NOTFOUND'",
  ].join(" ");
}

/**
 * Interpreta y normaliza datos de texto o estructuras intermedias.
 * @param {string} stdout - Entrada esperada por la función.
 * @returns {{ found: boolean; exePath: string | null; }} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function parseWindowsDockerDesktopResolveStdout(stdout: string): {
  found: boolean;
  exePath: string | null;
} {
  const lines = stdout
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines[0] === "FOUND" && lines.length >= 2 && lines[1]) {
    return { found: true, exePath: lines[1] };
  }
  return { found: false, exePath: null };
}

/**
 * Expone la operación "resolveWindowsDockerDesktopExePath" del instalador SmartEconomat.
 * @param {ProcessRunnerService} processRunner - Entrada esperada por la función.
 * @param {number} timeoutMs - Entrada esperada por la función.
 * @returns {Promise<string | null>} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export async function resolveWindowsDockerDesktopExePath(
  processRunner: ProcessRunnerService,
  timeoutMs = 20_000,
): Promise<string | null> {
  if (process.platform !== "win32") {
    return null;
  }

  const knownPath = await firstExistingPath(dockerDesktopExeCandidates);
  if (knownPath) {
    return knownPath;
  }

  const result = await processRunner.run({
    command: "powershell",
    args: ["-NoProfile", "-Command", buildWindowsDockerDesktopResolveCommand()],
    timeoutMs,
  });

  if (!result.ok) {
    return null;
  }

  const { found, exePath } = parseWindowsDockerDesktopResolveStdout(
    result.stdout,
  );
  return found && exePath ? exePath : null;
}

/**
 * Expone la operación "resolveWindowsDockerCliPath" del instalador SmartEconomat.
 * @param {ProcessRunnerService} processRunner - Entrada esperada por la función.
 * @param {number} timeoutMs - Entrada esperada por la función.
 * @returns {Promise<string | null>} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export async function resolveWindowsDockerCliPath(
  processRunner: ProcessRunnerService,
  timeoutMs = 20_000,
): Promise<string | null> {
  if (process.platform !== "win32") {
    return null;
  }

  const knownPath = await firstExistingPath(dockerCliCandidates);
  if (knownPath) {
    return knownPath;
  }

  const result = await processRunner.run({
    command: "powershell",
    args: ["-NoProfile", "-Command", buildWindowsDockerCliResolveCommand()],
    timeoutMs,
  });

  if (!result.ok) {
    return null;
  }

  const { found, exePath } = parseWindowsDockerDesktopResolveStdout(
    result.stdout,
  );
  return found && exePath ? exePath : null;
}
