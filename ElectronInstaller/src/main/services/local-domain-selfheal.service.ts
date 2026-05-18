import dns from "node:dns/promises";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { request as httpsRequest } from "node:https";

import { app } from "electron";

import type { ExecutionContext } from "@shared/contracts";

import { CertificateService } from "./certificate.service";
import { FirewallFacadeService } from "./firewall/firewall-facade.service";
import { ProcessRunnerService } from "./process-runner.service";

interface SelfHealOptions {
  onLog: (message: string) => void;
  allowElevation?: boolean;
}

interface HostsUpdatePlan {
  changed: boolean;
  nextContent: string;
  reason: string;
}

interface LocalValidationCheck {
  name: string;
  ok: boolean;
  detail: string;
}

interface LocalValidationSummary {
  ok: boolean;
  checks: LocalValidationCheck[];
}

const LOCAL_DOMAIN = "smarteconomat.app";
const LOOPBACK_IPV4 = "127.0.0.1";
const LOOPBACK_IPV6 = "::1";

export class LocalDomainSelfHealService {
  private readonly processRunner = new ProcessRunnerService();
  private readonly certificateService = new CertificateService();
  private readonly firewallFacade = new FirewallFacadeService();
  private readonly onLog: (message: string) => void;
  private readonly allowElevation: boolean;

  constructor(options: SelfHealOptions) {
    this.onLog = options.onLog;
    this.allowElevation = options.allowElevation ?? true;
  }

  async runIfNeeded(context: ExecutionContext): Promise<void> {
    if (context === "observe" || context === "runtime-auto-light") {
      this.onLog(
        "[SELF-HEAL] Omitido: reparación de dominio local solo bajo demanda (user-repair/install).",
      );
      return;
    }
    await this.run();
  }

  async run(): Promise<void> {
    const runtimePath = await this.resolveRuntimePath();
    if (!runtimePath) {
      this.onLog(
        "[SELF-HEAL] No se detectó runtime válido; se omite autorreparación de dominio local.",
      );
      return;
    }

    this.onLog(
      `[SELF-HEAL] Iniciando autorreparación de dominio local en ${process.platform}...`,
    );
    if (!this.allowElevation) {
      this.onLog(
        "[SELF-HEAL] Modo sin elevacion activo: no se solicitaran prompts UAC en segundo plano.",
      );
    }

    const envPath = path.join(runtimePath, ".env.prod");
    const envContent = await fs.readFile(envPath, "utf8");
    const httpPort = this.readEnvPort(envContent, "HTTP_PORT", 80);
    const httpsPort = this.readEnvPort(envContent, "HTTPS_PORT", 443);

    if (process.platform === "win32") {
      await this.ensureFirewall(runtimePath, httpPort, httpsPort);
    }

    await this.ensureHosts();
    await this.ensureCertificate(runtimePath);
    await this.validateLocalDomain(httpPort, httpsPort);

    this.onLog("[SELF-HEAL] Autorreparación de dominio local finalizada.");
  }

  private async ensureHosts(): Promise<void> {
    const hostsPath = this.resolveHostsPath();
    let currentContent = "";
    try {
      currentContent = await fs.readFile(hostsPath, "utf8");
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.onLog(
        `[SELF-HEAL] No se pudo leer hosts en ${hostsPath}: ${detail}`,
      );
      return;
    }

    const updatePlan = this.buildHostsUpdatePlan(currentContent);
    if (!updatePlan.changed) {
      this.onLog(`[SELF-HEAL] Hosts ya configurado: ${updatePlan.reason}`);
      return;
    }

    const backupPath = `${hostsPath}.smarteconomat.backup-${Date.now()}`;
    try {
      await this.writeHostsWithBackup(
        hostsPath,
        backupPath,
        updatePlan.nextContent,
      );
      this.onLog(
        `[SELF-HEAL] Hosts actualizado correctamente. Backup: ${backupPath}`,
      );
      return;
    } catch (error) {
      if (!this.isPermissionError(error)) {
        const detail = error instanceof Error ? error.message : String(error);
        this.onLog(`[SELF-HEAL] Error al modificar hosts: ${detail}`);
        return;
      }
    }

    const tempHostsPath = path.join(
      app.getPath("temp"),
      `smarteconomat-hosts-${Date.now()}.tmp`,
    );
    await fs.writeFile(tempHostsPath, updatePlan.nextContent, "utf8");

    try {
      const elevatedResult = await this.applyHostsWithElevation({
        hostsPath,
        backupPath,
        tempHostsPath,
      });
      if (elevatedResult.ok) {
        this.onLog(
          `[SELF-HEAL] Hosts actualizado con permisos elevados. Backup: ${backupPath}`,
        );
        return;
      }

      if (elevatedResult.cancelled) {
        this.onLog(
          "[SELF-HEAL] Usuario canceló elevación de permisos; hosts no fue modificado.",
        );
        return;
      }

      this.onLog(
        `[SELF-HEAL] Falló elevación para hosts: ${elevatedResult.detail}`,
      );
    } finally {
      await fs.rm(tempHostsPath, { force: true });
    }
  }

  private async ensureFirewall(
    runtimePath: string,
    httpPort: number,
    httpsPort: number,
  ): Promise<void> {
    const result = await this.firewallFacade.ensure({
      httpPort,
      httpsPort,
      host: LOCAL_DOMAIN,
      runtimePath,
      verificationMode: "preHostMapping",
      allowElevation: this.allowElevation,
      log: (line) => this.onLog(`[SELF-HEAL] ${line}`),
    });
    this.onLog(`[SELF-HEAL] ${result.userMessage}`);
  }

  private async ensureCertificate(runtimePath: string): Promise<void> {
    const ensureResult = await this.certificateService.ensureLocalCertificates(
      runtimePath,
      {
        overwrite: false,
        installToTrustStore: process.platform === "win32",
        domain: LOCAL_DOMAIN,
      },
    );
    if (!ensureResult.ok) {
      this.onLog(`[SELF-HEAL] Aviso certificado: ${ensureResult.message}`);
      return;
    }

    if (process.platform === "darwin") {
      const certPath = path.join(runtimePath, "certs", "fullchain.pem");
      const trustResult = await this.trustCertificateOnMac(certPath);
      if (!trustResult.ok) {
        this.onLog(
          `[SELF-HEAL] Aviso certificado macOS: ${trustResult.detail}`,
        );
      }
    }

    if (process.platform === "linux") {
      const certPath = path.join(runtimePath, "certs", "fullchain.pem");
      const trustResult = await this.trustCertificateOnLinux(certPath);
      if (!trustResult.ok) {
        this.onLog(
          `[SELF-HEAL] Aviso certificado Linux: ${trustResult.detail}`,
        );
      }
    }

    this.onLog("[SELF-HEAL] Certificado TLS asegurado para dominio local.");
  }

  private async validateLocalDomain(
    httpPort: number,
    httpsPort: number,
  ): Promise<void> {
    const checks: LocalValidationCheck[] = [];

    const dnsCheck = await this.checkDomainDns(LOCAL_DOMAIN);
    checks.push(dnsCheck);

    const port80Check = await this.checkTcpPort(LOOPBACK_IPV4, httpPort);
    checks.push({
      ...port80Check,
      name: "tcp-http-port",
      detail: `Puerto ${httpPort}: ${port80Check.detail}`,
    });

    const port443Check = await this.checkTcpPort(LOOPBACK_IPV4, httpsPort);
    checks.push({
      ...port443Check,
      name: "tcp-https-port",
      detail: `Puerto ${httpsPort}: ${port443Check.detail}`,
    });

    const httpCheck = await this.checkHttp(LOCAL_DOMAIN, httpPort);
    checks.push(httpCheck);

    const httpsCheck = await this.checkHttps(LOCAL_DOMAIN, httpsPort);
    checks.push(httpsCheck);

    const summary: LocalValidationSummary = {
      ok: checks.every((check) => check.ok),
      checks,
    };

    if (summary.ok) {
      this.onLog(
        "[SELF-HEAL] Validación local OK: DNS loopback y accesos HTTP/HTTPS correctos.",
      );
      return;
    }

    this.onLog("[SELF-HEAL] Validación local detectó incidencias:");
    for (const check of summary.checks) {
      const state = check.ok ? "OK" : "FAIL";
      this.onLog(`[SELF-HEAL] - ${state} ${check.name}: ${check.detail}`);
    }
  }

  private resolveHostsPath(): string {
    if (process.platform === "win32") {
      return "C:\\Windows\\System32\\drivers\\etc\\hosts";
    }

    return "/etc/hosts";
  }

  private buildHostsUpdatePlan(content: string): HostsUpdatePlan {
    const lines = content.split(/\r?\n/);
    const nextLines: string[] = [];
    let foundIpv4 = false;
    let foundIpv6 = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0 || trimmed.startsWith("#")) {
        nextLines.push(line);
        continue;
      }

      const [mappingPartRaw, ...commentParts] = line.split("#");
      const mappingPart = mappingPartRaw ?? "";
      const commentPart = commentParts.join("#");
      const tokens = mappingPart
        .trim()
        .split(/\s+/)
        .filter((token) => token.length > 0);

      if (tokens.length < 2) {
        nextLines.push(line);
        continue;
      }

      const [ip, ...hosts] = tokens;
      const cleanedHosts = hosts.filter((host) => host !== LOCAL_DOMAIN);

      if (hosts.includes(LOCAL_DOMAIN)) {
        if (ip === LOOPBACK_IPV4) {
          foundIpv4 = true;
          cleanedHosts.unshift(LOCAL_DOMAIN);
        } else if (ip === LOOPBACK_IPV6) {
          foundIpv6 = true;
          cleanedHosts.unshift(LOCAL_DOMAIN);
        }
      }

      if (cleanedHosts.length === 0) {
        if (commentPart.trim().length > 0) {
          nextLines.push(`#${commentPart}`);
        }
        continue;
      }

      const rebuilt = `${ip} ${cleanedHosts.join(" ")}`;
      nextLines.push(
        commentPart.trim().length > 0 ? `${rebuilt} #${commentPart}` : rebuilt,
      );
    }

    if (!foundIpv4) {
      nextLines.push(`${LOOPBACK_IPV4} ${LOCAL_DOMAIN}`);
      foundIpv4 = true;
    }
    if (!foundIpv6) {
      nextLines.push(`${LOOPBACK_IPV6} ${LOCAL_DOMAIN}`);
      foundIpv6 = true;
    }

    const nextContent = `${nextLines.join("\n").replace(/\n+$/g, "")}\n`;
    const currentNormalized = `${content.replace(/\r\n/g, "\n").replace(/\n+$/g, "")}\n`;
    const changed = nextContent !== currentNormalized;

    return {
      changed,
      nextContent,
      reason: changed ? "se aplicaron correcciones de mapeo" : "sin cambios",
    };
  }

  private async writeHostsWithBackup(
    hostsPath: string,
    backupPath: string,
    content: string,
  ): Promise<void> {
    await fs.copyFile(hostsPath, backupPath);
    await fs.writeFile(hostsPath, content, "utf8");
  }

  private isPermissionError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const nodeError = error as NodeJS.ErrnoException;
    return nodeError.code === "EACCES" || nodeError.code === "EPERM";
  }

  private async applyHostsWithElevation(context: {
    hostsPath: string;
    backupPath: string;
    tempHostsPath: string;
  }): Promise<{ ok: boolean; cancelled: boolean; detail: string }> {
    if (!this.allowElevation) {
      return {
        ok: false,
        cancelled: true,
        detail:
          "La elevacion esta deshabilitada para autorreparacion en segundo plano.",
      };
    }

    if (process.platform === "win32") {
      return this.applyHostsWithElevationWindows(context);
    }
    if (process.platform === "darwin") {
      return this.applyHostsWithElevationMac(context);
    }
    return this.applyHostsWithElevationLinux(context);
  }

  private async applyHostsWithElevationWindows(context: {
    hostsPath: string;
    backupPath: string;
    tempHostsPath: string;
  }): Promise<{ ok: boolean; cancelled: boolean; detail: string }> {
    const script = [
      "$ErrorActionPreference = 'Stop'",
      `Copy-Item -LiteralPath '${context.hostsPath}' -Destination '${context.backupPath}' -Force`,
      `Copy-Item -LiteralPath '${context.tempHostsPath}' -Destination '${context.hostsPath}' -Force`,
    ].join("; ");
    const encodedScript = Buffer.from(script, "utf16le").toString("base64");
    const elevateCommand = [
      `$argumentList = @('-NoProfile','-ExecutionPolicy','Bypass','-EncodedCommand','${encodedScript}')`,
      "$process = Start-Process -FilePath 'powershell.exe' -Verb RunAs -Wait -PassThru -ArgumentList $argumentList",
      "exit $process.ExitCode",
    ].join("; ");

    const result = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        elevateCommand,
      ],
      timeoutMs: 90_000,
    });

    if (result.ok) {
      return { ok: true, cancelled: false, detail: "ok" };
    }

    const detail = [result.stderr, result.stdout, result.message]
      .filter((value) => value.length > 0)
      .join(" | ");
    const cancelled = /cancel|denied|1223|canceled/i.test(detail);
    return { ok: false, cancelled, detail };
  }

  private async applyHostsWithElevationMac(context: {
    hostsPath: string;
    backupPath: string;
    tempHostsPath: string;
  }): Promise<{ ok: boolean; cancelled: boolean; detail: string }> {
    const shellCommand = [
      `cp ${this.quotePosixArg(context.hostsPath)} ${this.quotePosixArg(context.backupPath)}`,
      `cp ${this.quotePosixArg(context.tempHostsPath)} ${this.quotePosixArg(context.hostsPath)}`,
    ].join(" && ");
    const appleScript = `do shell script "${this.escapeForAppleScript(shellCommand)}" with administrator privileges`;

    const result = await this.processRunner.run({
      command: "osascript",
      args: ["-e", appleScript],
      timeoutMs: 90_000,
    });

    if (result.ok) {
      return { ok: true, cancelled: false, detail: "ok" };
    }
    const detail = [result.stderr, result.stdout, result.message]
      .filter((value) => value.length > 0)
      .join(" | ");
    const cancelled = /user canceled|cancelled|canceled/i.test(detail);
    return { ok: false, cancelled, detail };
  }

  private async applyHostsWithElevationLinux(context: {
    hostsPath: string;
    backupPath: string;
    tempHostsPath: string;
  }): Promise<{ ok: boolean; cancelled: boolean; detail: string }> {
    const shellCommand = [
      `cp ${this.quotePosixArg(context.hostsPath)} ${this.quotePosixArg(context.backupPath)}`,
      `cp ${this.quotePosixArg(context.tempHostsPath)} ${this.quotePosixArg(context.hostsPath)}`,
    ].join(" && ");
    const pkexecResult = await this.processRunner.run({
      command: "pkexec",
      args: ["sh", "-lc", shellCommand],
      timeoutMs: 90_000,
    });

    if (pkexecResult.ok) {
      return { ok: true, cancelled: false, detail: "ok" };
    }

    if (/Failed to spawn process/i.test(pkexecResult.message)) {
      const sudoResult = await this.processRunner.run({
        command: "sudo",
        args: ["sh", "-lc", shellCommand],
        timeoutMs: 90_000,
      });
      if (sudoResult.ok) {
        return { ok: true, cancelled: false, detail: "ok" };
      }

      const sudoDetail = [
        sudoResult.stderr,
        sudoResult.stdout,
        sudoResult.message,
      ]
        .filter((value) => value.length > 0)
        .join(" | ");
      const sudoCancelled = /cancel|denied|authentication|password/i.test(
        sudoDetail,
      );
      return { ok: false, cancelled: sudoCancelled, detail: sudoDetail };
    }

    const detail = [
      pkexecResult.stderr,
      pkexecResult.stdout,
      pkexecResult.message,
    ]
      .filter((value) => value.length > 0)
      .join(" | ");
    const cancelled = /cancel|denied|authentication/i.test(detail);
    return { ok: false, cancelled, detail };
  }

  private quotePosixArg(value: string): string {
    return `'${value.replace(/'/g, "'\\''")}'`;
  }

  private escapeForAppleScript(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  private async checkDomainDns(domain: string): Promise<LocalValidationCheck> {
    try {
      const addresses = await dns.lookup(domain, {
        all: true,
        verbatim: true,
      });
      if (addresses.length === 0) {
        return {
          name: "dns-loopback",
          ok: false,
          detail: "Sin resultados DNS.",
        };
      }

      const values = addresses.map((entry) => entry.address);
      const allLoopback = values.every(
        (value) => value === LOOPBACK_IPV4 || value === LOOPBACK_IPV6,
      );
      return {
        name: "dns-loopback",
        ok: allLoopback,
        detail: allLoopback
          ? `Resuelve a loopback: ${values.join(", ")}`
          : `Resuelve fuera de loopback: ${values.join(", ")}`,
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      return {
        name: "dns-loopback",
        ok: false,
        detail,
      };
    }
  }

  private async checkTcpPort(
    host: string,
    port: number,
  ): Promise<{
    ok: boolean;
    detail: string;
  }> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const finish = (ok: boolean, detail: string): void => {
        socket.destroy();
        resolve({ ok, detail });
      };

      socket.setTimeout(2_500);
      socket.once("connect", () =>
        finish(true, `escuchando en ${host}:${port}`),
      );
      socket.once("timeout", () => finish(false, `timeout en ${host}:${port}`));
      socket.once("error", (error: Error) =>
        finish(false, error.message || `sin conexión en ${host}:${port}`),
      );
      socket.connect(port, host);
    });
  }

  private async checkHttp(
    domain: string,
    port: number,
  ): Promise<LocalValidationCheck> {
    const url = `http://${domain}:${port}/`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
      return {
        name: "http-access",
        ok: response.ok || response.status < 500,
        detail: `HTTP ${response.status} en ${url}`,
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      return {
        name: "http-access",
        ok: false,
        detail: `${url} -> ${detail}`,
      };
    }
  }

  private async checkHttps(
    domain: string,
    port: number,
  ): Promise<LocalValidationCheck> {
    const url = `https://${domain}:${port}/`;
    return new Promise((resolve) => {
      const request = httpsRequest(
        {
          hostname: domain,
          port,
          path: "/",
          method: "GET",
          timeout: 8_000,
          rejectUnauthorized: true,
        },
        (response) => {
          response.resume();
          resolve({
            name: "https-access",
            ok: (response.statusCode ?? 500) < 500,
            detail: `HTTPS ${response.statusCode ?? 0} en ${url}`,
          });
        },
      );

      request.on("timeout", () => {
        request.destroy(new Error("timeout"));
      });
      request.on("error", (error: Error) => {
        resolve({
          name: "https-access",
          ok: false,
          detail: `${url} -> ${error.message}`,
        });
      });
      request.end();
    });
  }

  private async trustCertificateOnMac(
    certPath: string,
  ): Promise<{ ok: boolean; detail: string }> {
    const shellCommand = `security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ${this.quotePosixArg(certPath)}`;
    const appleScript = `do shell script "${this.escapeForAppleScript(shellCommand)}" with administrator privileges`;
    const result = await this.processRunner.run({
      command: "osascript",
      args: ["-e", appleScript],
      timeoutMs: 90_000,
    });

    if (result.ok) {
      return {
        ok: true,
        detail: "certificado confiado en keychain del sistema",
      };
    }

    const detail = [result.stderr, result.stdout, result.message]
      .filter((value) => value.length > 0)
      .join(" | ");
    return { ok: false, detail };
  }

  private async trustCertificateOnLinux(
    certPath: string,
  ): Promise<{ ok: boolean; detail: string }> {
    const installCommand = [
      `cp ${this.quotePosixArg(certPath)} /usr/local/share/ca-certificates/smarteconomat-local.crt`,
      "update-ca-certificates",
    ].join(" && ");
    const result = await this.processRunner.run({
      command: "pkexec",
      args: ["sh", "-lc", installCommand],
      timeoutMs: 90_000,
    });
    if (result.ok) {
      return {
        ok: true,
        detail: "certificado instalado en CA local del sistema",
      };
    }
    const detail = [result.stderr, result.stdout, result.message]
      .filter((value) => value.length > 0)
      .join(" | ");
    return { ok: false, detail };
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
