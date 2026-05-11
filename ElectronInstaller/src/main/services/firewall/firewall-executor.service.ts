import path from "node:path";

import { PathResolverService } from "@main/services/path-resolver.service";
import { ProcessRunnerService } from "@main/services/process-runner.service";

import type {
  FirewallEnsureContext,
  FirewallExecutionResult,
  FirewallExecutionStep,
  FirewallPlan,
} from "./firewall.types";

function nowIso(): string {
  return new Date().toISOString();
}

export class FirewallExecutorService {
  constructor(
    private readonly processRunner = new ProcessRunnerService(),
    private readonly pathResolver = new PathResolverService(),
  ) {}

  async execute(
    plan: FirewallPlan,
    context: FirewallEnsureContext,
  ): Promise<FirewallExecutionResult> {
    if (process.platform !== "win32" || plan.operations.length === 0) {
      return {
        ok: true,
        usedElevation: false,
        usedFallbackNetsh: false,
        timedOut: false,
        steps: [],
        errors: [],
      };
    }

    const steps: FirewallExecutionStep[] = [];
    let usedElevation = false;
    let usedFallbackNetsh = false;
    let timedOut = false;

    const nativeScript = plan.operations
      .map((operation) => {
        if (operation.type === "delete") {
          return `Remove-NetFirewallRule -DisplayName "${operation.ruleName.replace(/"/g, '\\"')}" -ErrorAction SilentlyContinue`;
        }

        if (operation.type === "create") {
          return `New-NetFirewallRule -DisplayName "${operation.ruleName.replace(/"/g, '\\"')}" -Direction Inbound -Action Allow -Protocol TCP -LocalPort ${operation.port} -Profile Domain,Private -Enabled True -ErrorAction Stop`;
        }

        return `Set-NetFirewallRule -DisplayName "${operation.ruleName.replace(/"/g, '\\"')}" -Direction Inbound -Action Allow -Profile Domain,Private -Enabled True -ErrorAction Stop`;
      })
      .join("; ");

    const nativeResult = await this.runAndMeasure(
      "powershell -Command <netsecurity>",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", nativeScript],
      35_000,
    );
    steps.push(nativeResult);

    if (nativeResult.ok) {
      return {
        ok: true,
        usedElevation,
        usedFallbackNetsh,
        timedOut,
        steps,
        errors: [],
      };
    }

    if (nativeResult.message.toLowerCase().includes("timed out")) {
      timedOut = true;
    }

    const fallbackResult = await this.runFallbackScript(context);
    steps.push(fallbackResult);
    usedFallbackNetsh = true;
    usedElevation = true;

    if (fallbackResult.message.toLowerCase().includes("timed out")) {
      timedOut = true;
    }

    return {
      ok: fallbackResult.ok,
      usedElevation,
      usedFallbackNetsh,
      timedOut,
      steps,
      errors: steps
        .filter((step) => !step.ok)
        .map((step) => step.stderr || step.message)
        .filter((entry) => entry.length > 0),
    };
  }

  private async runFallbackScript(
    context: FirewallEnsureContext,
  ): Promise<FirewallExecutionStep> {
    const scriptPath = path.join(
      this.pathResolver.getInstallerScriptsRoot(),
      "fix-local-firewall.ps1",
    );
    const command = [
      `$script = "${scriptPath.replace(/\\/g, "\\\\")}"`,
      `$httpPort = ${context.httpPort}`,
      `$httpsPort = ${context.httpsPort}`,
      "if (-not (Test-Path -LiteralPath $script)) { throw 'FIREWALL_FIX_SCRIPT_NOT_FOUND' }",
      "$argumentList = @('-NoProfile','-ExecutionPolicy','Bypass','-File',$script,'-HttpPort',$httpPort,'-HttpsPort',$httpsPort)",
      "Start-Process -FilePath 'powershell.exe' -Verb RunAs -Wait -ArgumentList $argumentList",
      "Write-Output 'FIREWALL_FIX_ELEVATED_OK'",
    ].join("; ");

    return this.runAndMeasure(
      "powershell -Command <elevated-fix-local-firewall>",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
      60_000,
    );
  }

  private async runAndMeasure(
    commandLabel: string,
    args: string[],
    timeoutMs: number,
  ): Promise<FirewallExecutionStep> {
    const startedAt = nowIso();
    const startedMs = Date.now();
    const result = await this.processRunner.run({
      command: "powershell",
      args,
      timeoutMs,
    });
    const finishedAt = nowIso();

    return {
      startedAt,
      finishedAt,
      durationMs: Date.now() - startedMs,
      command: commandLabel,
      ok: result.ok,
      stdout: result.stdout,
      stderr: result.stderr,
      message: result.message,
    };
  }
}
