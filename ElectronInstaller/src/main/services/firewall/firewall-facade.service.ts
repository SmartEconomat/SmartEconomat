import fs from "node:fs/promises";
import path from "node:path";

import { FirewallDetectorService } from "./firewall-detector.service";
import { FirewallExecutorService } from "./firewall-executor.service";
import { FirewallPlannerService } from "./firewall-planner.service";
import { FirewallReporterService } from "./firewall-reporter.service";
import type {
  FirewallEnsureContext,
  FirewallEnsureSummary,
} from "./firewall.types";
import { FirewallVerifierService } from "./firewall-verifier.service";

export class FirewallFacadeService {
  constructor(
    private readonly detector = new FirewallDetectorService(),
    private readonly planner = new FirewallPlannerService(),
    private readonly executor = new FirewallExecutorService(),
    private readonly verifier = new FirewallVerifierService(),
    private readonly reporter = new FirewallReporterService(),
  ) {}

  // #region agent log
  private resolveRepoRootForDebugLogs(): string {
    const cwd = process.cwd();
    const base = path.basename(cwd);
    if (base.toLowerCase() === "electroninstaller") {
      return path.resolve(cwd, "..");
    }
    return cwd;
  }

  private resolveDebugLogTargets(): string[] {
    const repoRoot = this.resolveRepoRootForDebugLogs();
    const targets = new Set<string>();
    targets.add(path.join(repoRoot, "debug-1b9740.log"));
    targets.add(path.join(repoRoot, ".cursor", "debug-1b9740.log"));

    const cwdBase = path.basename(process.cwd()).toLowerCase();
    if (cwdBase === "smarteconomat") {
      targets.add(path.join(process.cwd(), "debug-1b9740.log"));
      targets.add(path.join(process.cwd(), ".cursor", "debug-1b9740.log"));
    }

    return Array.from(targets);
  }

  private agentLog(hypothesisId: string, message: string, data: Record<string, unknown>) {
    const payload = {
      sessionId: "1b9740",
      runId: process.env.DEBUG_RUN_ID ?? "runtime",
      hypothesisId,
      location: "firewall-facade.service.ts",
      message,
      data,
      timestamp: Date.now(),
    };

    void (async () => {
      for (const logPath of this.resolveDebugLogTargets()) {
        try {
          await fs.mkdir(path.dirname(logPath), { recursive: true });
          await fs.appendFile(logPath, `${JSON.stringify(payload)}\n`, "utf8");
        } catch {
          // try next
        }
      }

      try {
        await fetch("http://127.0.0.1:7788/ingest/ae88677f-9837-49c4-8f3e-780503dbdea8", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "1b9740",
          },
          body: JSON.stringify(payload),
        });
      } catch {
        // ignore
      }
    })();
  }
  // #endregion

  async ensure(context: FirewallEnsureContext): Promise<FirewallEnsureSummary> {
    this.agentLog("IPC-FW-0", "firewall.facade.ensure.start", {
      verificationMode: context.verificationMode ?? "default",
      httpPort: context.httpPort,
      httpsPort: context.httpsPort,
      host: context.host,
    });

    context.log("Validando reglas de Windows Firewall...");
    const detection = await this.detector.detect(context);
    const plan = this.planner.buildPlan(detection);
    context.log(plan.summary);

    const execution = await this.executor.execute(plan, context);
    context.log(
      execution.ok
        ? "Corrección de firewall aplicada."
        : "No se pudo aplicar completamente la corrección de firewall.",
    );

    const verification = await this.verifier.verify(context);
    const userDecision = this.reporter.buildUserMessage(verification);
    const technicalMessage = [
      `rulesConsistent=${String(verification.rulesConsistent)}`,
      `localhostHttps=${String(verification.connectivity.localhostHttps)}`,
      `localDomainHttps=${String(verification.connectivity.localDomainHttps)}`,
      `executionOk=${String(execution.ok)}`,
      `fallbackNetsh=${String(execution.usedFallbackNetsh)}`,
    ].join(" | ");

    this.agentLog("IPC-FW-1", "firewall.facade.ensure.summary", {
      verificationMode: context.verificationMode ?? "default",
      connectivityChecksDeferred: verification.connectivityChecksDeferred ?? false,
      canContinue: userDecision.canContinue,
      warningCode: userDecision.warningCode,
      rulesConsistent: verification.rulesConsistent,
      localhostHttp: verification.connectivity.localhostHttp,
      localhostHttps: verification.connectivity.localhostHttps,
      localDomainHttp: verification.connectivity.localDomainHttp,
      localDomainHttps: verification.connectivity.localDomainHttps,
      dnsLoopback: verification.connectivity.dnsLoopback,
      listeningPorts: verification.connectivity.listeningPorts,
      localhostHttpErrorCode: verification.connectivity.localhostHttpErrorCode,
      localhostHttpsErrorCode: verification.connectivity.localhostHttpsErrorCode,
      localDomainHttpErrorCode: verification.connectivity.localDomainHttpErrorCode,
      localDomainHttpsErrorCode: verification.connectivity.localDomainHttpsErrorCode,
      technicalMessage,
    });

    return this.reporter.report({
      ok: userDecision.canContinue,
      canContinue: userDecision.canContinue,
      severity: userDecision.canContinue ? plan.severity : "critical",
      userMessage: userDecision.message,
      technicalMessage,
      warningCode: userDecision.warningCode,
      diagnostics: {
        detection,
        plan,
        execution,
        verification,
      },
    });
  }
}
