import { ProcessRunnerService } from "@main/services/process-runner.service";

import type {
  FirewallDetectionResult,
  FirewallEnsureContext,
  FirewallPortRuleSnapshot,
} from "./firewall.types";

export class FirewallDetectorService {
  constructor(private readonly processRunner = new ProcessRunnerService()) {}

  async detect(
    context: FirewallEnsureContext,
  ): Promise<FirewallDetectionResult> {
    const ports = [context.httpPort, context.httpsPort]
      .filter((value, index, all) => all.indexOf(value) === index)
      .filter((value) => value > 0);

    if (process.platform !== "win32") {
      return {
        isWindows: false,
        ports,
        isAdminLikely: true,
        rules: [],
        legacyRuleCount: 0,
        duplicatePorts: [],
        detectionErrors: [],
      };
    }

    const rulesScript = [
      "$ErrorActionPreference = 'Stop'",
      "$rules = Get-NetFirewallRule -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like 'SmartEconomat Local*' }",
      "if (-not $rules) { return }",
      "foreach ($rule in $rules) {",
      "  $filters = Get-NetFirewallPortFilter -AssociatedNetFirewallRule $rule -ErrorAction SilentlyContinue",
      "  if (-not $filters) { continue }",
      "  foreach ($filter in $filters) {",
      "    Write-Output ($rule.DisplayName + '|' + $rule.Direction + '|' + $rule.Action + '|' + $rule.Enabled + '|' + $rule.Profile + '|' + $filter.Protocol + '|' + $filter.LocalPort)",
      "  }",
      "}",
    ].join("; ");

    const isAdminScript = [
      "$identity = [Security.Principal.WindowsIdentity]::GetCurrent()",
      "$principal = [Security.Principal.WindowsPrincipal]::new($identity)",
      "$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)",
      "Write-Output $isAdmin",
    ].join("; ");

    const [rulesResult, adminResult] = await Promise.all([
      this.processRunner.run({
        command: "powershell",
        args: [
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-Command",
          rulesScript,
        ],
        timeoutMs: 20_000,
      }),
      this.processRunner.run({
        command: "powershell",
        args: [
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-Command",
          isAdminScript,
        ],
        timeoutMs: 10_000,
      }),
    ]);

    const parsedRules = this.parseRules(rulesResult.stdout);
    const ruleCountsByPort = new Map<number, number>();
    for (const rule of parsedRules) {
      ruleCountsByPort.set(
        rule.localPort,
        (ruleCountsByPort.get(rule.localPort) ?? 0) + 1,
      );
    }

    return {
      isWindows: true,
      ports,
      isAdminLikely: adminResult.ok
        ? adminResult.stdout.toLowerCase().includes("true")
        : false,
      rules: parsedRules,
      legacyRuleCount: parsedRules.filter((rule) =>
        /HTTP|HTTPS/i.test(rule.ruleName),
      ).length,
      duplicatePorts: Array.from(ruleCountsByPort.entries())
        .filter((entry) => entry[1] > 1)
        .map((entry) => entry[0]),
      detectionErrors: [rulesResult, adminResult]
        .filter((result) => !result.ok)
        .map((result) => result.stderr || result.message),
    };
  }

  private parseRules(stdout: string): FirewallPortRuleSnapshot[] {
    if (!stdout.trim()) {
      return [];
    }

    return stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line.includes("|"))
      .map((line) => {
        const [
          ruleName,
          direction,
          action,
          enabled,
          profileRaw,
          protocol,
          localPort,
        ] = line.split("|");
        return {
          ruleName: ruleName ?? "unknown",
          direction: direction ?? "Unknown",
          action: action ?? "Unknown",
          enabled: (enabled ?? "").toLowerCase() === "true",
          profileRaw: profileRaw ?? "",
          protocol: protocol ?? "Unknown",
          localPort: Number.parseInt(localPort ?? "0", 10),
        };
      })
      .filter((rule) => Number.isFinite(rule.localPort) && rule.localPort > 0);
  }
}
