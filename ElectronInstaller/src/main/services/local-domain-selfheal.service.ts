import fs from "node:fs/promises";
import path from "node:path";

import { app } from "electron";

import { CertificateService } from "./certificate.service";
import { FirewallFacadeService } from "./firewall/firewall-facade.service";
import { PathResolverService } from "./path-resolver.service";
import { ProcessRunnerService } from "./process-runner.service";

interface SelfHealOptions {
  onLog: (message: string) => void;
}

export class LocalDomainSelfHealService {
  private readonly processRunner = new ProcessRunnerService();
  private readonly pathResolver = new PathResolverService();
  private readonly certificateService = new CertificateService();
  private readonly firewallFacade = new FirewallFacadeService();
  private readonly onLog: (message: string) => void;

  constructor(options: SelfHealOptions) {
    this.onLog = options.onLog;
  }

  async run(): Promise<void> {
    if (process.platform !== "win32") {
      return;
    }

    const runtimePath = await this.resolveRuntimePath();
    if (!runtimePath) {
      this.onLog(
        "[SELF-HEAL] No se detectó runtime válido; se omite autorreparación de dominio local.",
      );
      return;
    }

    this.onLog("[SELF-HEAL] Iniciando autorreparación de dominio local...");

    await this.ensureFirewall(runtimePath);
    await this.ensureHosts(runtimePath);
    await this.ensureCertificate(runtimePath);
    await this.validateLocalDomain();

    this.onLog("[SELF-HEAL] Autorreparación de dominio local finalizada.");
  }

  private async ensureHosts(runtimePath: string): Promise<void> {
    const scriptPath = path.join(
      this.pathResolver.getInstallerScriptsRoot(),
      "fix-local-hosts.ps1",
    );
    await this.runElevatedScript(scriptPath, []);
    this.onLog("[SELF-HEAL] Hosts reparado para smarteconomat.app.");

    await fs.mkdir(path.join(runtimePath, "diagnostics"), { recursive: true });
  }

  private async ensureFirewall(runtimePath: string): Promise<void> {
    const envPath = path.join(runtimePath, ".env.prod");
    const envContent = await fs.readFile(envPath, "utf8");
    const httpPort = this.readEnvPort(envContent, "HTTP_PORT", 80);
    const httpsPort = this.readEnvPort(envContent, "HTTPS_PORT", 443);

    const result = await this.firewallFacade.ensure({
      httpPort,
      httpsPort,
      host: "smarteconomat.app",
      runtimePath,
      verificationMode: "preHostMapping",
      log: (line) => this.onLog(`[SELF-HEAL] ${line}`),
    });
    this.onLog(`[SELF-HEAL] ${result.userMessage}`);
  }

  private async ensureCertificate(runtimePath: string): Promise<void> {
    const result =
      await this.certificateService.reinstallCertificateToTrustStore(
        runtimePath,
      );
    if (!result.ok) {
      this.onLog(`[SELF-HEAL] Aviso certificado: ${result.message}`);
      return;
    }
    this.onLog("[SELF-HEAL] Certificado TLS reinstalado en trust store.");
  }

  private async validateLocalDomain(): Promise<void> {
    const scriptPath = path.join(
      this.pathResolver.getInstallerScriptsRoot(),
      "validate-local-domain.ps1",
    );
    const result = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath,
        "-Domain",
        "smarteconomat.app",
      ],
      timeoutMs: 30_000,
    });

    if (!result.ok) {
      this.onLog(
        `[SELF-HEAL] Validación de dominio local reportó incidencias: ${result.stderr || result.message}`,
      );
      return;
    }

    this.onLog("[SELF-HEAL] Validación de dominio local completada.");
  }

  private async runElevatedScript(
    scriptPath: string,
    scriptArgs: string[],
  ): Promise<void> {
    const serializedArgs = scriptArgs
      .map((value) => `'${value.replace(/'/g, "''")}'`)
      .join(",");
    const command = [
      `$script = "${scriptPath.replace(/\\/g, "\\\\")}"`,
      "if (-not (Test-Path -LiteralPath $script)) { throw 'SCRIPT_NOT_FOUND' }",
      `$argumentList = @('-NoProfile','-ExecutionPolicy','Bypass','-File',$script${serializedArgs ? `,${serializedArgs}` : ""})`,
      "Start-Process -FilePath 'powershell.exe' -Verb RunAs -Wait -ArgumentList $argumentList",
    ].join("; ");

    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
      timeoutMs: 90_000,
    });

    if (!result.ok) {
      throw new Error(result.stderr || result.message);
    }
  }

  private readEnvPort(content: string, key: string, fallback: number): number {
    const regex = new RegExp(`^${key}=(\\d+)$`, "m");
    const match = content.match(regex);
    if (!match?.[1]) {
      return fallback;
    }
    const parsed = Number.parseInt(match[1], 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private async resolveRuntimePath(): Promise<string | null> {
    const markerPath = path.join(
      app.getPath("appData"),
      "SmartEconomatInstaller",
      "runtime-path.txt",
    );
    const fallbackRuntimePath = "C:/SmartEconomatRuntime";
    const candidates = [
      await this.readRuntimeMarker(markerPath),
      fallbackRuntimePath,
    ]
      .filter((value): value is string => value.length > 0)
      .filter((value, index, all) => all.indexOf(value) === index);

    for (const candidate of candidates) {
      const envPath = path.join(candidate, ".env.prod");
      const composePath = path.join(
        candidate,
        "project",
        "docker-compose.prod.yml",
      );
      try {
        await Promise.all([fs.access(envPath), fs.access(composePath)]);
        return candidate;
      } catch {
        // try next candidate
      }
    }

    return null;
  }

  private async readRuntimeMarker(markerPath: string): Promise<string> {
    try {
      const content = await fs.readFile(markerPath, "utf8");
      return content.trim();
    } catch {
      return "";
    }
  }
}
