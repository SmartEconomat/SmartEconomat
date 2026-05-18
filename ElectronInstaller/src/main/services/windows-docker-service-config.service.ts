import path from "node:path";

import { ProcessRunnerService } from "./process-runner.service";
import { PathResolverService } from "./path-resolver.service";

export const DOCKER_SERVICE_STARTMODE_MANUAL = "DOCKER_SERVICE_STARTMODE_MANUAL";
export const DOCKER_SERVICE_NOT_FOUND = "DOCKER_SERVICE_NOT_FOUND";

export interface ComDockerServiceConfigResult {
  ok: boolean;
  startMode: string;
  state: string;
  detail: string;
  errorCode?: string;
}

export interface EnsureComDockerServiceOptions {
  startIfStopped?: boolean;
  configureOnly?: boolean;
}

/**
 * Configura y verifica com.docker.service vía script canónico en scripts/ops.
 */
export class WindowsDockerServiceConfigService {
  constructor(
    private readonly processRunner = new ProcessRunnerService(),
    private readonly pathResolver = new PathResolverService(),
  ) {}

  async readStartMode(): Promise<ComDockerServiceConfigResult> {
    if (process.platform !== "win32") {
      return {
        ok: false,
        startMode: "unsupported",
        state: "unsupported",
        detail: "Solo disponible en Windows.",
        errorCode: "PLATFORM_NOT_WINDOWS",
      };
    }

    const result = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        [
          "$s = Get-CimInstance Win32_Service -Filter \"Name='com.docker.service'\" -ErrorAction SilentlyContinue",
          "if ($null -eq $s) { Write-Output '{\"ok\":false,\"startMode\":\"missing\",\"state\":\"missing\",\"detail\":\"not found\"}'; exit 2 }",
          "$payload = @{ ok = ($s.StartMode -eq 'Auto' -or $s.StartMode -eq 'Automatic'); startMode = $s.StartMode; state = $s.State; detail = 'read-only' } | ConvertTo-Json -Compress",
          "Write-Output $payload",
          "if ($s.StartMode -eq 'Auto' -or $s.StartMode -eq 'Automatic') { exit 0 } else { exit 1 }",
        ].join("; "),
      ],
      timeoutMs: 15_000,
      cwd: this.pathResolver.getProjectRoot(),
    });

    return this.parseScriptJson(result.stdout, result.code ?? 1, result.stderr);
  }

  async ensureAutomatic(
    options: EnsureComDockerServiceOptions = {},
  ): Promise<ComDockerServiceConfigResult> {
    if (process.platform !== "win32") {
      return {
        ok: false,
        startMode: "unsupported",
        state: "unsupported",
        detail: "Solo disponible en Windows.",
        errorCode: "PLATFORM_NOT_WINDOWS",
      };
    }

    const scriptPath = path.join(
      this.pathResolver.getInstallerScriptsRoot(),
      "ops",
      "ensure-com-docker-service-automatic.ps1",
    );

    const psArgs = [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
    ];
    if (options.startIfStopped) {
      psArgs.push("-StartIfStopped");
    }
    if (options.configureOnly) {
      psArgs.push("-ConfigureOnly");
    }

    const result = await this.processRunner.run({
      command: "powershell",
      args: psArgs,
      timeoutMs: 30_000,
      cwd: this.pathResolver.getProjectRoot(),
    });

    const parsed = this.parseScriptJson(
      result.stdout,
      result.code ?? 1,
      result.stderr || result.message,
    );

    if (!parsed.ok && parsed.startMode.toLowerCase() === "manual") {
      return {
        ...parsed,
        errorCode: DOCKER_SERVICE_STARTMODE_MANUAL,
      };
    }

    if (parsed.startMode === "missing") {
      return {
        ...parsed,
        errorCode: DOCKER_SERVICE_NOT_FOUND,
      };
    }

    return parsed;
  }

  private parseScriptJson(
    stdout: string,
    exitCode: number,
    stderr: string,
  ): ComDockerServiceConfigResult {
    const jsonLine = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.startsWith("{"));

    if (jsonLine) {
      try {
        const parsed = JSON.parse(jsonLine) as {
          ok?: boolean;
          startMode?: string;
          state?: string;
          detail?: string;
        };
        return {
          ok: parsed.ok === true,
          startMode: parsed.startMode ?? "unknown",
          state: parsed.state ?? "unknown",
          detail: parsed.detail ?? "",
        };
      } catch {
        // Continúa con fallback.
      }
    }

    const detail = [stderr, stdout].filter((v) => v.length > 0).join(" | ");
    return {
      ok: exitCode === 0,
      startMode: "unknown",
      state: "unknown",
      detail: detail || `exit code ${exitCode}`,
    };
  }
}
