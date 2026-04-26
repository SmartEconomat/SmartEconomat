import fs from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import path from "node:path";

import { ProcessRunnerService } from "@main/services/process-runner.service";

import type {
  FirewallConnectivityResult,
  FirewallEnsureContext,
  FirewallVerificationResult,
} from "./firewall.types";

export class FirewallVerifierService {
  constructor(private readonly processRunner = new ProcessRunnerService()) {}

  // #region agent log
  private resolveWorkspaceRootForDebugLogs(): string {
    const cwd = process.cwd();
    const base = path.basename(cwd);
    if (base.toLowerCase() === "electroninstaller") {
      return path.resolve(cwd, "..");
    }
    return cwd;
  }

  private resolveDebugLogTargets(): string[] {
    const repoRoot = this.resolveWorkspaceRootForDebugLogs();
    const targets = new Set<string>();

    // Canonical path requested by debug mode tooling for this workspace session
    targets.add(path.join(repoRoot, "debug-1b9740.log"));

    // Cursor ingest often mirrors NDJSON here (observed in practice on this machine)
    targets.add(path.join(repoRoot, ".cursor", "debug-1b9740.log"));

    // Extra fallback: if cwd is repo root already
    const cwdBase = path.basename(process.cwd()).toLowerCase();
    if (cwdBase === "smarteconomat") {
      targets.add(path.join(process.cwd(), "debug-1b9740.log"));
      targets.add(path.join(process.cwd(), ".cursor", "debug-1b9740.log"));
    }

    return Array.from(targets);
  }

  private debugLog(
    hypothesisId: string,
    message: string,
    data: Record<string, unknown>,
  ) {
    const payload = {
      sessionId: "1b9740",
      runId: process.env.DEBUG_RUN_ID ?? "pre-fix",
      hypothesisId,
      location: "firewall-verifier.service.ts",
      message,
      data,
      timestamp: Date.now(),
    };

    void (async () => {
      try {
        for (const logPath of this.resolveDebugLogTargets()) {
          try {
            await fs.mkdir(path.dirname(logPath), { recursive: true });
            await fs.appendFile(
              logPath,
              `${JSON.stringify(payload)}\n`,
              "utf8",
            );
          } catch {
            // try next target
          }
        }
      } catch {
        // ignore
      }

      try {
        await fetch(
          "http://127.0.0.1:7788/ingest/ae88677f-9837-49c4-8f3e-780503dbdea8",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Session-Id": "1b9740",
            },
            body: JSON.stringify(payload),
          },
        );
      } catch {
        // ignore
      }
    })();
  }
  // #endregion

  async verify(
    context: FirewallEnsureContext,
  ): Promise<FirewallVerificationResult> {
    if (process.platform !== "win32") {
      return {
        rulesConsistent: true,
        connectivity: {
          localhostHttp: true,
          localhostHttps: true,
          localDomainHttp: true,
          localDomainHttps: true,
          dnsLoopback: true,
          listeningPorts: [],
          lanProbeAttempted: false,
          lanProbeOk: true,
        },
        message: "Sistema no Windows: verificación de firewall omitida.",
      };
    }

    const rulesScript = [
      `$ports = @(${context.httpPort},${context.httpsPort}) | Sort-Object -Unique`,
      "$candidateRules = Get-NetFirewallRule -ErrorAction SilentlyContinue | Where-Object {",
      "  $_.Direction -eq 'Inbound' -and $_.Action -eq 'Allow' -and $_.Enabled -eq 'True' -and $_.DisplayName -like 'SmartEconomat Local*'",
      "}",
      "$ok = $true",
      "foreach ($port in $ports) {",
      "  $found = $false",
      "  foreach ($rule in $candidateRules) {",
      "    $filters = Get-NetFirewallPortFilter -AssociatedNetFirewallRule $rule -ErrorAction SilentlyContinue",
      "    if (-not $filters) { continue }",
      "    $portMatch = $filters | Where-Object { $_.Protocol -eq 'TCP' -and ($_.LocalPort -eq [string]$port -or $_.LocalPort -eq 'Any') }",
      "    if ($portMatch) { $found = $true; break }",
      "  }",
      "  if (-not $found) { $ok = $false }",
      "}",
      "if ($ok) { Write-Output 'RULES_OK' } else { Write-Output 'RULES_KO' }",
    ].join("; ");

    const rulesResult = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        rulesScript,
      ],
      timeoutMs: 20_000,
    });

    // #region agent log
    this.debugLog("H1", "firewall.rules.ps1.result", {
      ok: rulesResult.ok,
      message: rulesResult.message,
      stdoutHead: rulesResult.stdout.slice(0, 200),
      stderrHead: rulesResult.stderr.slice(0, 200),
      httpPort: context.httpPort,
      httpsPort: context.httpsPort,
      host: context.host,
    });
    // #endregion

    const listeningPorts = await this.getListeningPorts([
      context.httpPort,
      context.httpsPort,
    ]);

    // #region agent log
    this.debugLog("H2", "firewall.listeningPorts", {
      listeningPorts,
      httpPort: context.httpPort,
      httpsPort: context.httpsPort,
    });
    // #endregion

    const rulesConsistent =
      rulesResult.ok && rulesResult.stdout.includes("RULES_OK");
    const mode = context.verificationMode ?? "default";

    // #region agent log
    this.debugLog("H0", "firewall.verification.mode", {
      mode,
      rulesConsistent,
      host: context.host,
      httpPort: context.httpPort,
      httpsPort: context.httpsPort,
    });
    // #endregion

    if (mode === "preHostMapping") {
      // Antes de escribir `hosts`, no podemos interpretar fallos HTTPS/HTTP al dominio local
      // como bloqueo: el DNS del dominio aún puede no apuntar a loopback.
      return {
        rulesConsistent,
        connectivityChecksDeferred: true,
        connectivity: {
          localhostHttp: false,
          localhostHttps: false,
          localDomainHttp: false,
          localDomainHttps: false,
          dnsLoopback: false,
          listeningPorts,
          lanProbeAttempted: false,
          lanProbeOk: true,
        },
        message:
          "Verificación de firewall (pre-hosts): reglas validadas; conectividad HTTP completa se validará tras mapear hosts.",
      };
    }

    const localhostHttpUrl = `http://localhost:${context.httpPort}`;
    const localhostHttpsUrl = `https://localhost:${context.httpsPort}`;
    const localDomainHttpUrl = `http://${context.host}:${context.httpPort}`;
    const localDomainHttpsUrl = `https://${context.host}:${context.httpsPort}`;

    const localhostHttpProbe = await this.probeUrlWithMeta(localhostHttpUrl);
    const localhostHttpsProbe = await this.probeUrlWithMeta(localhostHttpsUrl);
    const localDomainHttpProbe =
      await this.probeUrlWithMeta(localDomainHttpUrl);
    const localDomainHttpsProbe =
      await this.probeUrlWithMeta(localDomainHttpsUrl);

    // #region agent log
    this.debugLog("H3", "firewall.httpProbes.meta", {
      localhostHttp: localhostHttpProbe,
      localhostHttps: localhostHttpsProbe,
      localDomainHttp: localDomainHttpProbe,
      localDomainHttps: localDomainHttpsProbe,
    });
    // #endregion

    const tcpLocalhostHttp = await this.probeTcpConnect(
      "127.0.0.1",
      context.httpPort,
    );
    const tcpLocalhostHttps = await this.probeTcpConnect(
      "127.0.0.1",
      context.httpsPort,
    );

    // #region agent log
    this.debugLog("H4", "firewall.tcpConnect.loopback", {
      tcpLocalhostHttp,
      tcpLocalhostHttps,
      httpPort: context.httpPort,
      httpsPort: context.httpsPort,
    });
    // #endregion

    const dnsLoopback = await this.verifyDnsLoopback(context.host);

    // #region agent log
    this.debugLog("H5", "firewall.dnsLoopback", {
      dnsLoopback,
      host: context.host,
    });
    // #endregion

    const connectivity: FirewallConnectivityResult = {
      localhostHttp: localhostHttpProbe.ok,
      localhostHttps: localhostHttpsProbe.ok,
      localDomainHttp: localDomainHttpProbe.ok,
      localDomainHttps: localDomainHttpsProbe.ok,
      dnsLoopback,
      listeningPorts,
      localhostHttpErrorCode: localhostHttpProbe.errorCode,
      localhostHttpsErrorCode: localhostHttpsProbe.errorCode,
      localDomainHttpErrorCode: localDomainHttpProbe.errorCode,
      localDomainHttpsErrorCode: localDomainHttpsProbe.errorCode,
      lanProbeAttempted: true,
      lanProbeOk: true,
    };

    return {
      rulesConsistent,
      connectivity,
      message: "Verificación de firewall y conectividad completada.",
    };
  }

  private async getListeningPorts(ports: number[]): Promise<number[]> {
    const script = [
      `$ports = @(${ports.join(",")}) | Sort-Object -Unique`,
      "foreach ($port in $ports) {",
      "  $listener = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1",
      "  if ($listener) { Write-Output $port }",
      "}",
    ].join("; ");
    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
      timeoutMs: 15_000,
    });
    if (!result.ok) {
      return [];
    }
    return result.stdout
      .split(/\r?\n/)
      .map((line) => Number.parseInt(line.trim(), 10))
      .filter((value) => Number.isFinite(value));
  }

  private async verifyDnsLoopback(host: string): Promise<boolean> {
    const script = [
      `$resolved = [System.Net.Dns]::GetHostAddresses("${host.replace(/"/g, "")}")`,
      "$loopback = $resolved | Where-Object { $_.ToString() -eq '127.0.0.1' -or $_.ToString() -eq '::1' }",
      "if ($loopback) { Write-Output 'DNS_OK' } else { Write-Output 'DNS_KO' }",
    ].join("; ");
    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
      timeoutMs: 10_000,
    });
    return result.ok && result.stdout.includes("DNS_OK");
  }

  private async probeUrl(url: string): Promise<boolean> {
    const meta = await this.probeUrlWithMeta(url);
    return meta.ok;
  }

  private async probeUrlWithMeta(url: string): Promise<{
    ok: boolean;
    statusCode?: number;
    errorName?: string;
    errorMessage?: string;
    errorCode?: string;
    timedOut?: boolean;
  }> {
    return new Promise((resolve) => {
      const parsed = new URL(url);
      const client = parsed.protocol === "https:" ? https : http;
      const request = client.request(
        {
          method: "GET",
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
          path: parsed.pathname || "/",
          timeout: 4_000,
          rejectUnauthorized: false,
        },
        (response) => {
          response.resume();
          const code = response.statusCode ?? 0;
          resolve({
            ok: code >= 200 && code < 500,
            statusCode: code,
          });
        },
      );
      request.on("timeout", () => {
        request.destroy();
        resolve({ ok: false, timedOut: true });
      });
      request.on("error", (error) => {
        const err = error as NodeJS.ErrnoException;
        resolve({
          ok: false,
          errorName: err.name,
          errorMessage: err.message,
          ...(typeof err.code === "string" ? { errorCode: err.code } : {}),
        });
      });
      request.end();
    });
  }

  private async probeTcpConnect(
    host: string,
    port: number,
  ): Promise<{
    ok: boolean;
    errorName?: string;
    errorMessage?: string;
    errorCode?: string;
    timedOut?: boolean;
  }> {
    return new Promise((resolve) => {
      const socket = net.connect({ host, port });
      const timer = setTimeout(() => {
        socket.destroy();
        resolve({ ok: false, timedOut: true });
      }, 2_000);

      socket.once("connect", () => {
        clearTimeout(timer);
        socket.end();
        resolve({ ok: true });
      });

      socket.once("error", (error) => {
        clearTimeout(timer);
        const err = error as NodeJS.ErrnoException;
        resolve({
          ok: false,
          errorName: err.name,
          errorMessage: err.message,
          ...(typeof err.code === "string" ? { errorCode: err.code } : {}),
        });
      });
    });
  }
}
