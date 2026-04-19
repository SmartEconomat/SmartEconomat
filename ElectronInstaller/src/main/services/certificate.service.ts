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
      await this.writeLocalSelfSignedCertificates(certPaths);

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
  ): Promise<void> {
    await fs.mkdir(paths.liveDir, { recursive: true });
    await fs.mkdir(path.dirname(paths.stableFullchainPath), {
      recursive: true,
    });

    const pems = selfsigned.generate(
      [
        { name: "commonName", value: "smarteconomat.app" },
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
            cA: false,
          },
          {
            name: "subjectAltName",
            altNames: [
              { type: 2, value: "smarteconomat.app" },
              { type: 2, value: "localhost" },
              { type: 2, value: "api.smarteconomat.app" },
              { type: 7, ip: "127.0.0.1" },
            ],
          },
        ],
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
   * del usuario actual en Windows. Esto permite que los navegadores confíen
   * en el certificado autofirmado sin mostrar advertencias.
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

    // PowerShell script para importar el certificado al almacén Root del usuario
    const script = `
      $certPath = '${normalizedPath}'
      
      if (-not (Test-Path $certPath)) {
        Write-Error "El certificado no existe: $certPath"
        exit 1
      }
      
      try {
        # Importar al almacén de certificados raíz de confianza del usuario actual
        $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($certPath)
        
        # Almacén Root del usuario actual (CurrentUser)
        $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
        $store.Open("ReadWrite")
        
        # Verificar si ya existe un certificado con el mismo subject
        $existingCerts = $store.Certificates | Where-Object { $_.Subject -like "*smarteconomat*" }
        foreach ($existing in $existingCerts) {
          $store.Remove($existing)
        }
        
        $store.Add($cert)
        $store.Close()
        
        Write-Host "Certificado instalado correctamente en el almacén de confianza del usuario."
        exit 0
      } catch {
        Write-Error "Error al instalar certificado: $_"
        exit 1
      }
    `;

    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
      timeoutMs: 30_000,
    });

    if (result.ok) {
      return {
        ok: true,
        message:
          "Certificado instalado en el almacén de confianza de Windows.",
      };
    }

    // Si falla con el usuario actual, intentar con el almacén de la máquina local (requiere admin)
    const adminScript = `
      $certPath = '${normalizedPath}'
      
      try {
        $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($certPath)
        
        # Almacén Root de la máquina local (LocalMachine) - requiere elevación
        $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
        $store.Open("ReadWrite")
        
        $existingCerts = $store.Certificates | Where-Object { $_.Subject -like "*smarteconomat*" }
        foreach ($existing in $existingCerts) {
          $store.Remove($existing)
        }
        
        $store.Add($cert)
        $store.Close()
        
        Write-Host "Certificado instalado en el almacén de confianza de la máquina."
        exit 0
      } catch {
        Write-Error "Error al instalar certificado: $_"
        exit 1
      }
    `;

    const adminResult = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        `Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command "${adminScript.replace(/"/g, '\\"').replace(/\n/g, " ")}"'`,
      ],
      timeoutMs: 60_000,
    });

    if (adminResult.ok) {
      return {
        ok: true,
        message:
          "Certificado instalado en el almacén de confianza de Windows (nivel sistema).",
      };
    }

    return {
      ok: false,
      message:
        "No se pudo instalar el certificado en el almacén de confianza. Puede que necesites permisos de administrador o instalarlo manualmente.",
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
   */
  private async removeCertificateFromWindowsTrustStore(): Promise<boolean> {
    if (process.platform !== "win32") {
      return true;
    }

    const script = `
      $stores = @(
        @{ Location = "CurrentUser"; Store = "Root" },
        @{ Location = "LocalMachine"; Store = "Root" }
      )
      
      foreach ($storeInfo in $stores) {
        try {
          $store = New-Object System.Security.Cryptography.X509Certificates.X509Store($storeInfo.Store, $storeInfo.Location)
          $store.Open("ReadWrite")
          
          $certs = $store.Certificates | Where-Object { $_.Subject -like "*smarteconomat*" }
          foreach ($cert in $certs) {
            $store.Remove($cert)
          }
          
          $store.Close()
        } catch {
          # Ignorar errores - puede no tener permisos para LocalMachine
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
