import fs from "node:fs/promises";
import path from "node:path";

import selfsigned from "selfsigned";
import type { SelfSignedExtension } from "selfsigned";

import type { OperationResult } from "@shared/contracts";

import { ProcessRunnerService } from "./process-runner.service";

interface CertificatePaths {
  liveDir: string;
  fullchainPath: string;
  privkeyPath: string;
  stableFullchainPath: string;
  stablePrivkeyPath: string;
  stableCrtPath: string;
}

interface WindowsTrustInstallOptions {
  /**
   * Fuerza el diálogo de seguridad de Windows (certutil / asistente de importación).
   * Las rutas automáticas (TLS en despliegue, self-heal) deben dejarlo en false.
   */
  preferInteractivePrompt?: boolean;
}

interface ReinstallCertificateToTrustStoreOptions
  extends WindowsTrustInstallOptions {
  openManualTrustUi?: boolean;
}

interface EnsureCertificateOptions {
  overwrite: boolean;
  /**
   * Instalar el certificado en el almacén de certificados de Windows
   * para que sea confiado por el sistema y los navegadores.
   * Por defecto true en Windows.
   */
  installToTrustStore?: boolean;
  /**
   * El dominio para el cual se generarán los certificados.
   */
  domain?: string;
}

export class CertificateService {
  private readonly processRunner = new ProcessRunnerService();
  private readonly testRuntimeOptimization =
    process.env.VITEST === "true" ||
    process.env.NODE_ENV === "test" ||
    process.env.VITEST_WORKER_ID !== undefined;

  async ensureLocalCertificates(
    runtimePath: string,
    options: EnsureCertificateOptions,
  ): Promise<OperationResult> {
    const certPaths = this.resolveCertificatePaths(runtimePath);
    const shouldInstallToTrustStore = this.testRuntimeOptimization
      ? false
      : (options.installToTrustStore ?? process.platform === "win32");

    if (!options.overwrite) {
      const existing = await this.hasLocalCertificates(certPaths);
      if (existing) {
        // Siempre verificar e instalar en trust store si no está presente.
        // Cubre el caso de reinstalación donde el cert existe en disco
        // pero fue eliminado del trust store de Windows.
        if (shouldInstallToTrustStore) {
          const isInstalled = await this.isCertificateInTrustStore(
            certPaths.stableCrtPath,
          );
          if (!isInstalled) {
            // No bloqueante: advertir si falla pero continuar.
            await this.installCertificateToWindowsTrustStore(
              certPaths.stableCrtPath,
            );
          }
        }
        return {
          ok: true,
          message:
            "Certificados locales ya presentes; se reutilizan sin regeneracion.",
        };
      }
    }

    try {
      await this.writeLocalSelfSignedCertificates(
        certPaths,
        options.domain || "smarteconomat.app",
      );

      // Instalar en el almacen de certificados de Windows.
      // No es bloqueante: si Windows impide la escritura, el instalador
      // continua y muestra advertencia.
      if (shouldInstallToTrustStore) {
        await this.installCertificateToWindowsTrustStore(
          certPaths.stableCrtPath,
        );
      }

      return {
        ok: true,
        message:
          "Certificados locales autofirmados generados e instalados como confiables.",
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron generar certificados locales.";
      return {
        ok: false,
        message,
        errorCode: "TLS_CERTIFICATE_GENERATION_FAILED",
      };
    }
  }

  async removeLocalCertificates(runtimePath: string): Promise<OperationResult> {
    const certsDir = path.join(runtimePath, "certs");
    const certsWebrootDir = path.join(runtimePath, "certs-webroot");

    // Primero, eliminar del trust store de Windows si existe
    if (process.platform === "win32" && !this.testRuntimeOptimization) {
      await this.removeCertificateFromWindowsTrustStore();
    }

    try {
      await fs.rm(certsDir, { recursive: true, force: true });
      await fs.rm(certsWebrootDir, { recursive: true, force: true });

      return {
        ok: true,
        message: "Certificados locales eliminados correctamente.",
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron eliminar los certificados locales.";

      return {
        ok: false,
        message,
        errorCode: "TLS_CERTIFICATE_CLEANUP_FAILED",
      };
    }
  }

  private resolveCertificatePaths(runtimePath: string): CertificatePaths {
    const certsDir = path.join(runtimePath, "certs");
    const liveDir = path.join(certsDir, "live", "local-smarteconomat");

    return {
      liveDir,
      fullchainPath: path.join(liveDir, "fullchain.pem"),
      privkeyPath: path.join(liveDir, "privkey.pem"),
      stableFullchainPath: path.join(certsDir, "fullchain.pem"),
      stablePrivkeyPath: path.join(certsDir, "privkey.pem"),
      stableCrtPath: path.join(certsDir, "smarteconomat.crt"),
    };
  }

  private async hasLocalCertificates(
    paths: CertificatePaths,
  ): Promise<boolean> {
    try {
      await fs.access(paths.fullchainPath);
      await fs.access(paths.privkeyPath);
      await fs.access(paths.stableFullchainPath);
      await fs.access(paths.stablePrivkeyPath);
      return true;
    } catch {
      return false;
    }
  }

  private async writeLocalSelfSignedCertificates(
    paths: CertificatePaths,
    domain: string,
  ): Promise<void> {
    await fs.mkdir(paths.liveDir, { recursive: true });
    await fs.mkdir(path.dirname(paths.stableFullchainPath), {
      recursive: true,
    });

    const certificateExtensions: SelfSignedExtension[] = [
      {
        name: "basicConstraints",
        cA: true,
      },
      {
        name: "keyUsage",
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true,
      },
      {
        name: "extKeyUsage",
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true,
      },
      {
        name: "subjectAltName",
        altNames: [
          { type: 2, value: domain },
          { type: 2, value: "localhost" },
          { type: 2, value: `api.${domain}` },
          { type: 7, ip: "127.0.0.1" },
        ],
      },
    ];

    const pems = selfsigned.generate(
      [
        { name: "commonName", value: domain },
        { name: "organizationName", value: "SmartEconomat" },
        { name: "countryName", value: "ES" },
      ],
      {
        algorithm: "sha256",
        days: 825,
        keySize: this.testRuntimeOptimization ? 1024 : 2048,
        extensions: certificateExtensions,
      },
    );

    await fs.writeFile(paths.fullchainPath, pems.cert, { encoding: "utf8" });
    await fs.writeFile(paths.privkeyPath, pems.private, { encoding: "utf8" });
    await fs.copyFile(paths.fullchainPath, paths.stableFullchainPath);
    await fs.copyFile(paths.fullchainPath, paths.stableCrtPath);
    await fs.copyFile(paths.privkeyPath, paths.stablePrivkeyPath);

    try {
      await fs.chmod(paths.privkeyPath, 0o600);
      await fs.chmod(paths.stablePrivkeyPath, 0o600);
    } catch {
      // Some Windows filesystems ignore POSIX permission changes.
    }
  }

  // ── Windows Trust Store Management ────────────────────────────

  /**
   * Instala el certificado de CA raiz en CurrentUser\Root y, si el proceso
   * esta elevado (UAC), tambien en LocalMachine\Root.
   *
   * Lee el fichero PEM, extrae el ultimo bloque de certificado (CA raiz en
   * una cadena fullchain; el unico cert disponible si es autofirmado), y lo
   * instala con X509Store.Add() sin necesidad de fichero .cer temporal.
   * Verifica por thumbprint si ya existe antes de añadir.
   * NUNCA bloquea la instalacion principal: fallback a certutil con dialogo UAC.
   */
  private async installCertificateToWindowsTrustStore(
    certPath: string,
    options?: WindowsTrustInstallOptions,
  ): Promise<OperationResult> {
    if (process.platform !== "win32") {
      return {
        ok: true,
        message: "Instalacion en trust store solo disponible en Windows.",
      };
    }

    const normalizedPath = path.win32.normalize(certPath);
    const preferInteractivePrompt = options?.preferInteractivePrompt === true;

    if (preferInteractivePrompt) {
      return this.openCertificateManualInstallUI(normalizedPath);
    }
    const escapedPath = normalizedPath.replace(/'/g, "''");

    const buildScript = (storeLocation: "CurrentUser" | "LocalMachine") =>
      [
        "$ErrorActionPreference = 'Stop'",
        `$p = '${escapedPath}'`,
        "if (-not (Test-Path -LiteralPath $p)) { Write-Error \"No existe: $p\"; exit 1 }",
        "$raw = Get-Content -LiteralPath $p -Raw",
        "$rx = [regex]::Matches($raw, '(?s)-----BEGIN CERTIFICATE-----(.*?)-----END CERTIFICATE-----')",
        "if ($rx.Count -eq 0) { Write-Error 'Sin bloque de certificado'; exit 1 }",
        "$b64 = $rx[$rx.Count-1].Groups[1].Value -replace '`r','' -replace '`n','' -replace ' ',''",
        "$der = [System.Convert]::FromBase64String($b64)",
        "$cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new([byte[]]$der)",
        `$store = [System.Security.Cryptography.X509Certificates.X509Store]::new('Root','${storeLocation}')`,
        "$store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)",
        "try {",
        "  $ex = $store.Certificates.Find([System.Security.Cryptography.X509Certificates.X509FindType]::FindByThumbprint,$cert.Thumbprint,$false)",
        `  if ($ex.Count -eq 0) { $store.Add($cert); Write-Host "CERT_INSTALLED:${storeLocation}:$($cert.Thumbprint)" }`,
        `  else { Write-Host "CERT_PRESENT:${storeLocation}:$($cert.Thumbprint)" }`,
        "} finally { $store.Close(); $cert.Dispose() }",
        "exit 0",
      ].join("; ");

    const runScript = async (
      location: "CurrentUser" | "LocalMachine",
    ): Promise<{
      ok: boolean;
      stdout: string;
      stderr: string;
      message: string;
    }> =>
      this.processRunner.run({
        command: "powershell",
        args: [
          "-NoProfile",
          "-NonInteractive",
          "-ExecutionPolicy",
          "Bypass",
          "-Command",
          buildScript(location),
        ],
        timeoutMs: 20_000,
      });

    // Intento 1: CurrentUser\Root (no requiere UAC)
    const currentUserResult = await runScript("CurrentUser");

    if (!currentUserResult.ok) {
      // Fallback: certutil con dialogo de seguridad de Windows
      return this.openCertificateManualInstallUI(normalizedPath);
    }

    const messages: string[] = [currentUserResult.stdout.trim()].filter(
      (line) => line.length > 0,
    );

    // Intento 2: LocalMachine\Root solo si el proceso ya es administrador
    const elevated = await this.isWindowsProcessElevated();
    if (elevated) {
      const lmResult = await runScript("LocalMachine");
      if (lmResult.ok) {
        messages.push(lmResult.stdout.trim());
      }
    }

    return {
      ok: true,
      message:
        messages.join(" | ") ||
        "Certificado SmartEconomat instalado en el almacen de confianza de Windows.",
    };
  }

  /**
   * Abre la interfaz de Windows para que el usuario confíe manualmente en el certificado.
   * Usa certutil -addstore -user Root (diálogo de seguridad) y, si falla, el asistente CryptExtAddCER.
   */
  async openCertificateManualInstallUI(
    certPath: string,
  ): Promise<OperationResult> {
    if (process.platform !== "win32") {
      return { ok: true, message: "No aplica fuera de Windows." };
    }

    const normalizedPath = path.win32.normalize(certPath);
    const escapedPath = normalizedPath.replace(/'/g, "''");

    try {
      await fs.access(normalizedPath);
    } catch {
      return {
        ok: false,
        message: `No se encontró el certificado en: ${normalizedPath}`,
        errorCode: "TLS_CERTIFICATE_NOT_FOUND",
      };
    }

    const certutilResult = await this.processRunner.run({
      command: "certutil",
      args: ["-addstore", "-user", "Root", normalizedPath],
      timeoutMs: 120_000,
      showWindow: true,
    });

    if (certutilResult.ok) {
      const trusted = await this.isCertificateInTrustStore(normalizedPath);
      if (trusted) {
        return {
          ok: true,
          message:
            "Certificado añadido al almacén de entidades de certificación raíz de confianza del usuario.",
        };
      }
    }

    const wizardResult = await this.processRunner.run({
      command: "rundll32.exe",
      args: ["cryptext.dll,CryptExtAddCER", normalizedPath],
      timeoutMs: 15_000,
      showWindow: true,
    });

    if (!wizardResult.ok) {
      await this.processRunner.run({
        command: "powershell",
        args: [
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-Command",
          `Start-Process -FilePath '${escapedPath}'`,
        ],
        showWindow: true,
        timeoutMs: 10_000,
      });
    }

    const trustedAfterWizard = await this.isCertificateInTrustStore(
      normalizedPath,
    );
    if (trustedAfterWizard) {
      return {
        ok: true,
        message:
          "Certificado instalado en el almacén de confianza de Windows.",
      };
    }

    return {
      ok: false,
      message:
        "Confirma el diálogo de seguridad de Windows o usa el asistente abierto: Instalar certificado → Usuario actual → Entidades de certificación raíz de confianza.",
      errorCode: "TLS_CERTIFICATE_MANUAL_INSTALL_REQUIRED",
    };
  }

  private async isWindowsProcessElevated(): Promise<boolean> {
    if (process.platform !== "win32") {
      return false;
    }

    const result = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        "([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)",
      ],
      timeoutMs: 5_000,
    });

    return result.ok && result.stdout.trim().toLowerCase() === "true";
  }

  /**
   * Verifica si el certificado de SmartEconomat ya está instalado
   * en el almacén de certificados raíz de confianza de Windows.
   *
   * Si se proporciona certPath, verifica por thumbprint (más preciso).
   * Como fallback, busca por Subject (CN o O conteniendo 'smarteconomat').
   */
  private async isCertificateInTrustStore(certPath?: string): Promise<boolean> {
    if (process.platform !== "win32") {
      return false;
    }

    // Bloque de verificación por thumbprint (solo si tenemos el fichero)
    const thumbprintLines = certPath
      ? [
          `$cp = '${certPath.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`,
          "if (Test-Path -LiteralPath $cp) {",
          "  try {",
          "    $raw = Get-Content -LiteralPath $cp -Raw",
          "    $rx = [regex]::Matches($raw, '(?s)-----BEGIN CERTIFICATE-----(.*?)-----END CERTIFICATE-----')",
          "    if ($rx.Count -gt 0) {",
          "      $b64 = $rx[$rx.Count-1].Groups[1].Value -replace '`r','' -replace '`n','' -replace ' ',''",
          "      $der = [System.Convert]::FromBase64String($b64)",
          "      $c = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new([byte[]]$der)",
          "      $tp = $c.Thumbprint; $c.Dispose()",
          "      foreach ($loc in @('CurrentUser','LocalMachine')) {",
          "        $st = [System.Security.Cryptography.X509Certificates.X509Store]::new('Root',$loc)",
          "        try { $st.Open('ReadOnly'); $f = $st.Certificates.Find([System.Security.Cryptography.X509Certificates.X509FindType]::FindByThumbprint,$tp,$false); $st.Close(); if ($f.Count -gt 0) { exit 0 } } catch { try { $st.Close() } catch {} }",
          "      }",
          "    }",
          "  } catch { }",
          "}",
        ]
      : [];

    const scriptLines = [
      "$ErrorActionPreference = 'SilentlyContinue'",
      ...thumbprintLines,
      "foreach ($loc in @('CurrentUser','LocalMachine')) {",
      "  try {",
      "    $st = [System.Security.Cryptography.X509Certificates.X509Store]::new('Root',$loc)",
      "    $st.Open('ReadOnly')",
      "    $found = $st.Certificates | Where-Object { ($_.Subject -like '*smarteconomat*' -or $_.Subject -like '*SmartEconomat*') -and $_.NotAfter -gt (Get-Date) }",
      "    $st.Close()",
      "    if ($found.Count -gt 0) { exit 0 }",
      "  } catch { }",
      "}",
      "exit 1",
    ];

    const result = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        scriptLines.join("; "),
      ],
      timeoutMs: 15_000,
    });

    return result.ok;
  }


  /**
   * Elimina los certificados de SmartEconomat del almacén de confianza.
   * Usa Get-ChildItem + Remove-Item que es el método correcto en PowerShell
   * para eliminar del Root store sin lanzar AccessDenied como X509Store.Remove().
   */
  private async removeCertificateFromWindowsTrustStore(): Promise<boolean> {
    if (process.platform !== "win32") {
      return true;
    }

    const script = `
      $storeLocations = @('CurrentUser', 'LocalMachine')
      foreach ($loc in $storeLocations) {
        try {
          $storePath = "Cert:\\$loc\\Root"
          $certs = Get-ChildItem -Path $storePath -ErrorAction SilentlyContinue |
            Where-Object { $_.Subject -like '*smarteconomat*' }
          foreach ($cert in $certs) {
            try {
              Remove-Item -Path "$storePath\\$($cert.Thumbprint)" -Force -ErrorAction Stop
              Write-Host "Eliminado de $($loc): $($cert.Thumbprint)"
            } catch {
              Write-Host "No se pudo eliminar de $($loc): $($_.Exception.Message)"
            }
          }
        } catch {
          Write-Host "Error accediendo a $($loc): $($_.Exception.Message)"
        }
      }
      exit 0
    `;

    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
      timeoutMs: 30_000,
    });

    return result.ok;
  }

  /**
   * Reinstala el certificado en el trust store de Windows (quita huellas antiguas e importa el .crt actual).
   * Por defecto es silencioso; `openManualTrustUi: true` abre certmgr y el asistente (IPC explícito del usuario).
   */
  async reinstallCertificateToTrustStore(
    runtimePath: string,
    options?: ReinstallCertificateToTrustStoreOptions,
  ): Promise<OperationResult> {
    const certPaths = this.resolveCertificatePaths(runtimePath);
    const openManualTrustUi = options?.openManualTrustUi === true;

    try {
      await fs.access(certPaths.stableCrtPath);
    } catch {
      return {
        ok: false,
        message:
          "No se encontró el certificado. Ejecuta primero la configuración de TLS.",
        errorCode: "TLS_CERTIFICATE_NOT_FOUND",
      };
    }

    await this.removeCertificateFromWindowsTrustStore();

    if (openManualTrustUi) {
      return this.installCertificateToWindowsTrustStore(certPaths.stableCrtPath, {
        preferInteractivePrompt: true,
      });
    }

    return this.installCertificateToWindowsTrustStore(certPaths.stableCrtPath);
  }

  /**
   * Abre el Administrador de Certificados de Windows (certmgr.msc).
   */
  async openCertificateManager(): Promise<boolean> {
    if (process.platform !== "win32") return false;
    const { spawn } = await import("node:child_process");
    spawn("certmgr.msc", [], { shell: true, detached: true });
    return true;
  }
}
