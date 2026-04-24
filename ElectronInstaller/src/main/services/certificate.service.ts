import fs from "node:fs/promises";
import path from "node:path";

import selfsigned from "selfsigned";

import type { OperationResult } from "@shared/contracts";

import { ProcessRunnerService } from "./process-runner.service";

interface CertificatePaths {
  liveDir: string;
  fullchainPath: string;
  privkeyPath: string;
  stableFullchainPath: string;
  stablePrivkeyPath: string;
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

  async ensureLocalCertificates(
    runtimePath: string,
    options: EnsureCertificateOptions,
  ): Promise<OperationResult> {
    const certPaths = this.resolveCertificatePaths(runtimePath);
    const shouldInstallToTrustStore =
      options.installToTrustStore ?? process.platform === "win32";

    if (!options.overwrite) {
      const existing = await this.hasLocalCertificates(certPaths);
      if (existing) {
        // Verificar si ya está instalado en el trust store
        if (shouldInstallToTrustStore) {
          const isInstalled = await this.isCertificateInTrustStore();
          if (!isInstalled) {
            const installResult = await this.installCertificateToWindowsTrustStore(
              certPaths.stableFullchainPath,
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
      await this.writeLocalSelfSignedCertificates(certPaths, options.domain || "smarteconomat.app");

      // Instalar en el almacén de certificados de Windows
      if (shouldInstallToTrustStore) {
        const installResult = await this.installCertificateToWindowsTrustStore(
          certPaths.stableFullchainPath,
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
    if (process.platform === "win32") {
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

    const pems = selfsigned.generate(
      [
        { name: "commonName", value: domain },
        { name: "organizationName", value: "SmartEconomat" },
        { name: "countryName", value: "ES" },
      ],
      {
        algorithm: "sha256",
        days: 825,
        keySize: 2048,
        extensions: [
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
        ] as any[],
      },
    );

    await fs.writeFile(paths.fullchainPath, pems.cert, { encoding: "utf8" });
    await fs.writeFile(paths.privkeyPath, pems.private, { encoding: "utf8" });
    await fs.copyFile(paths.fullchainPath, paths.stableFullchainPath);
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
   * en Windows usando Import-Certificate (convierte PEM → DER en memoria).
   *
   * Estrategia:
   *  1. Intentar CurrentUser\Root (no requiere elevación, no usa Remove).
   *  2. Si falla, intentar LocalMachine\Root directamente (funciona si el
   *     proceso ya corre elevado como administrador).
   *
   * Se evita deliberadamente X509Store.Remove() en el almacén Root porque
   * lanza "Acceso denegado" en contextos no interactivos incluso con permisos
   * de administrador. Import-Certificate maneja duplicados internamente.
   * Se evita Start-Process -Verb RunAs porque falla cuando el proceso padre
   * ya está elevado por UAC.
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

    // Script robusto: convierte PEM → DER en memoria y usa Import-Certificate.
    // Import-Certificate no requiere Remove previo y no lanza AccessDenied.
    const buildScript = (storeLocation: "CurrentUser" | "LocalMachine") => `
      $ErrorActionPreference = 'Stop'
      $certPemPath = '${normalizedPath}'

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

        # Escribir DER a archivo temporal
        $derTempPath = [System.IO.Path]::GetTempFileName() + '.cer'
        [System.IO.File]::WriteAllBytes($derTempPath, $derBytes)

        # Importar al almacén Root (Import-Certificate gestiona duplicados sin Remove)
        $imported = Import-Certificate -FilePath $derTempPath -CertStoreLocation 'Cert:\\${storeLocation}\\Root'

        Remove-Item -Path $derTempPath -Force -ErrorAction SilentlyContinue
        Write-Host "Certificado importado correctamente. Thumbprint: $($imported.Thumbprint)"
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
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        buildScript("CurrentUser"),
      ],
      timeoutMs: 30_000,
    });

    if (currentUserResult.ok) {
      return {
        ok: true,
        message:
          "Certificado instalado en el almacén de confianza del usuario (CurrentUser).",
      };
    }

    // Intento 2: LocalMachine\Root directamente (funciona si ya corremos como admin)
    // No se usa Start-Process -Verb RunAs porque falla cuando el proceso padre ya está elevado.
    const localMachineResult = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        buildScript("LocalMachine"),
      ],
      timeoutMs: 30_000,
    });

    if (localMachineResult.ok) {
      return {
        ok: true,
        message:
          "Certificado instalado en el almacén de confianza del sistema (LocalMachine).",
      };
    }

    return {
      ok: false,
      message:
        "No se pudo instalar el certificado en el almacén de confianza. " +
        `CurrentUser: ${currentUserResult.stderr || currentUserResult.message}. ` +
        `LocalMachine: ${localMachineResult.stderr || localMachineResult.message}.`,
      errorCode: "TLS_TRUST_STORE_INSTALL_FAILED",
    };
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
   * Reinstala el certificado en el trust store de Windows.
   * Útil para reparar problemas de confianza del certificado.
   */
  async reinstallCertificateToTrustStore(
    runtimePath: string,
  ): Promise<OperationResult> {
    const certPaths = this.resolveCertificatePaths(runtimePath);

    try {
      await fs.access(certPaths.stableFullchainPath);
    } catch {
      return {
        ok: false,
        message:
          "No se encontró el certificado. Ejecuta primero la configuración de TLS.",
        errorCode: "TLS_CERTIFICATE_NOT_FOUND",
      };
    }

    // Eliminar certificados antiguos
    await this.removeCertificateFromWindowsTrustStore();

    // Instalar el certificado actual
    return this.installCertificateToWindowsTrustStore(
      certPaths.stableFullchainPath,
    );
  }
}
