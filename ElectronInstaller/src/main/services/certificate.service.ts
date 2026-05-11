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

interface ReinstallCertificateToTrustStoreOptions {
  /**
   * Solo para acción explícita del usuario: abre certmgr y el asistente de importación.
   * Las rutas automáticas (preflight, self-heal) deben dejarlo en false.
   */
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
        // Verificar si ya está instalado en el trust store
        if (shouldInstallToTrustStore) {
          const isInstalled = await this.isCertificateInTrustStore();
          if (!isInstalled) {
            const installResult =
              await this.installCertificateToWindowsTrustStore(
                certPaths.stableCrtPath,
              );
            if (!installResult.ok) {
              return installResult;
            }
          }
        }
        return {
          ok: true,
          message:
            "Certificados locales ya presentes; se reutilizan sin regeneración.",
        };
      }
    }

    try {
      await this.writeLocalSelfSignedCertificates(
        certPaths,
        options.domain || "smarteconomat.app",
      );

      // Instalar en el almacén de certificados de Windows
      if (shouldInstallToTrustStore) {
        const installResult = await this.installCertificateToWindowsTrustStore(
          certPaths.stableCrtPath,
        );
        if (!installResult.ok) {
          return installResult;
        }
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
   * Instala el certificado en el almacén de certificados raíz de confianza
   * en Windows usando X509Store (convierte PEM → DER en memoria).
   *
   * Estrategia:
   *  1. Intentar CurrentUser\Root (no requiere elevación).
   *  2. Si el proceso ya corre elevado, intentar también LocalMachine\Root.
   *
   * El certificado local no debe bloquear la instalación: si Windows impide
   * escribir en el trust store, el instalador continúa con advertencia.
   */
  private async installCertificateToWindowsTrustStore(
    certPath: string,
  ): Promise<OperationResult> {
    if (process.platform !== "win32") {
      return {
        ok: true,
        message: "Instalación en trust store solo disponible en Windows.",
      };
    }

    const normalizedPath = path.win32.normalize(certPath);
    const escapedPath = normalizedPath.replace(/'/g, "''");

    // Script robusto: convierte PEM → DER en memoria y usa X509Store.Add().
    // Evita Import-Certificate porque puede colgarse en algunos Windows.
    const buildScript = (storeLocation: "CurrentUser" | "LocalMachine") => `
      $ErrorActionPreference = 'Stop'
      $certPemPath = '${escapedPath}'

      if (-not (Test-Path $certPemPath)) {
        Write-Error "El certificado no existe: $certPemPath"
        exit 1
      }

      try {
        # Leer PEM y convertir a bytes DER (quitar cabeceras y decodificar Base64)
        $pemContent = Get-Content -Path $certPemPath -Raw
        $b64 = $pemContent \`
          -replace '-----BEGIN CERTIFICATE-----', '' \`
          -replace '-----END CERTIFICATE-----', '' \`
          -replace '\`r', '' \`
          -replace '\`n', '' \`
          -replace ' ', ''
        $derBytes = [System.Convert]::FromBase64String($b64)

        $cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new([byte[]]$derBytes)
        $store = [System.Security.Cryptography.X509Certificates.X509Store]::new('Root', '${storeLocation}')
        $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
        try {
          $existing = $store.Certificates.Find(
            [System.Security.Cryptography.X509Certificates.X509FindType]::FindByThumbprint,
            $cert.Thumbprint,
            $false
          )
          if ($existing.Count -eq 0) {
            $store.Add($cert)
            Write-Host "Certificado importado correctamente en ${storeLocation}. Thumbprint: $($cert.Thumbprint)"
          } else {
            Write-Host "Certificado ya presente en ${storeLocation}. Thumbprint: $($cert.Thumbprint)"
          }
        } finally {
          $store.Close()
          $cert.Dispose()
        }
        exit 0
      } catch {
        Write-Error "Error al importar certificado en ${storeLocation}: $($_.Exception.Message)"
        exit 1
      }
    `;

    // Intento 1: CurrentUser\Root (sin necesidad de elevación)
    const currentUserResult = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        buildScript("CurrentUser"),
      ],
      timeoutMs: 12_000,
    });

    if (currentUserResult.ok) {
      const elevated = await this.isWindowsProcessElevated();
      if (!elevated) {
        return {
          ok: true,
          message:
            "Certificado instalado en el almacén de confianza del usuario (CurrentUser).",
        };
      }

      const localMachineResult = await this.processRunner.run({
        command: "powershell",
        args: [
          "-NoProfile",
          "-NonInteractive",
          "-ExecutionPolicy",
          "Bypass",
          "-Command",
          buildScript("LocalMachine"),
        ],
        timeoutMs: 12_000,
      });

      return {
        ok: true,
        message: localMachineResult.ok
          ? "Certificado instalado en CurrentUser y LocalMachine."
          : `Certificado instalado en CurrentUser. Aviso LocalMachine: ${
              localMachineResult.stderr || localMachineResult.message
            }`,
      };
    }

    // Si el intento silencioso falla, abrimos el diálogo de seguridad de Windows (certutil)
    // que "saltará" una advertencia oficial preguntando al usuario si desea confiar.
    return this.openCertificateManualInstallUI(certPath);
  }

  /**
   * Abre la interfaz de Windows para que el usuario confíe manualmente en el certificado.
   * Usa certutil -addstore -user Root, que lanza un diálogo de seguridad crítico de Windows.
   */
  async openCertificateManualInstallUI(
    certPath: string,
  ): Promise<OperationResult> {
    if (process.platform !== "win32") {
      return { ok: true, message: "No aplica fuera de Windows." };
    }

    const normalizedPath = path.win32.normalize(certPath);

    // Intentamos certutil que es el que lanza el pop-up de seguridad de "Desea instalar..."
    const result = await this.processRunner.run({
      command: "certutil",
      args: ["-addstore", "-user", "Root", normalizedPath],
      timeoutMs: 60_000, // Esperamos a que el usuario interactúe
    });

    if (result.ok) {
      return {
        ok: true,
        message: "El usuario ha aceptado instalar el certificado manualmente.",
      };
    }

    // Como último recurso, abrimos el archivo para que el usuario vea el asistente de importación
    await this.processRunner.run({
      command: "powershell",
      args: ["-Command", `Start-Process '${normalizedPath}'`],
    });

    return {
      ok: false,
      message:
        "No se pudo instalar automáticamente. Se ha abierto el certificado: haz clic en 'Instalar certificado' -> 'Usuario actual' -> 'Colocar todos los certificados en el siguiente almacén' -> 'Entidades de certificación de raíz de confianza'.",
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
   * en el almacén de certificados de confianza.
   */
  private async isCertificateInTrustStore(): Promise<boolean> {
    if (process.platform !== "win32") {
      return false;
    }

    const script = `
      $stores = @(
        [System.Security.Cryptography.X509Certificates.X509Store]::new("Root", "CurrentUser"),
        [System.Security.Cryptography.X509Certificates.X509Store]::new("Root", "LocalMachine")
      )
      
      foreach ($store in $stores) {
        try {
          $store.Open("ReadOnly")
          $certs = $store.Certificates | Where-Object { 
            $_.Subject -like "*smarteconomat*" -and 
            $_.NotAfter -gt (Get-Date)
          }
          $store.Close()
          
          if ($certs.Count -gt 0) {
            exit 0
          }
        } catch {
          # Ignorar errores de acceso
        }
      }
      
      exit 1
    `;

    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
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

    const installResult = await this.installCertificateToWindowsTrustStore(
      certPaths.stableCrtPath,
    );

    if (openManualTrustUi) {
      try {
        await this.openCertificateManager();
        const { spawn } = await import("node:child_process");
        spawn("cmd", ["/c", "start", "", certPaths.stableCrtPath], {
          shell: true,
          detached: true,
        });
      } catch (e) {
        console.error("No se pudo abrir la interfaz de certificados:", e);
      }
    }

    return installResult;
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
