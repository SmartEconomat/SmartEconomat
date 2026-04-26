import type { ProcessRunnerService } from "./process-runner.service";

/**
 * PowerShell: localiza Docker Desktop.exe (PF, LocalAppData\Programs, WOW6432Node, registro Uninstall).
 * Salida: primera línea FOUND|NOTFOUND; si FOUND, segunda línea = ruta absoluta del ejecutable.
 */
export function buildWindowsDockerDesktopResolveCommand(): string {
  return [
    "$ErrorActionPreference = 'SilentlyContinue'",
    "$candidates = @(",
    "  (Join-Path $env:ProgramFiles 'Docker\\Docker\\Docker Desktop.exe'),",
    "  (Join-Path $env:LocalAppData 'Programs\\Docker\\Docker\\Docker Desktop.exe')",
    ")",
    "$pfx86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')",
    "if ($pfx86) { $candidates += (Join-Path $pfx86 'Docker\\Docker\\Docker Desktop.exe') }",
    "foreach ($p in $candidates) {",
    "  if ($p -and (Test-Path -LiteralPath $p)) {",
    "    Write-Output 'FOUND'",
    "    Write-Output $p",
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

export function parseWindowsDockerDesktopResolveStdout(
  stdout: string,
): { found: boolean; exePath: string | null } {
  const lines = stdout
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines[0] === "FOUND" && lines.length >= 2 && lines[1]) {
    return { found: true, exePath: lines[1] };
  }
  return { found: false, exePath: null };
}

export async function resolveWindowsDockerDesktopExePath(
  processRunner: ProcessRunnerService,
  timeoutMs = 20_000,
): Promise<string | null> {
  if (process.platform !== "win32") {
    return null;
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
