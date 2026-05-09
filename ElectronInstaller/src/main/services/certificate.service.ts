import fs from "node:fs/promises";
import path from "node:path";

import selfsigned from "selfsigned";

import type { OperationResult } from "@shared/contracts";

interface CertificatePaths {
  liveDir: string;
  fullchainPath: string;
  privkeyPath: string;
  stableFullchainPath: string;
  stablePrivkeyPath: string;
}

interface EnsureCertificateOptions {
  overwrite: boolean;
}

/** Servicio del proceso principal: CertificateService. */
export class CertificateService {
  /**
   * Garantiza la existencia o validez del recurso indicado.
   * @param {string} runtimePath - Entrada esperada por la función.
   * @param {EnsureCertificateOptions} options - Entrada esperada por la función.
   * @returns {Promise<OperationResult<undefined>>} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  async ensureLocalCertificates(
    runtimePath: string,
    options: EnsureCertificateOptions,
  ): Promise<OperationResult> {
    const certPaths = this.resolveCertificatePaths(runtimePath);

    if (!options.overwrite) {
      const existing = await this.hasLocalCertificates(certPaths);
      if (existing) {
        return {
          ok: true,
          message:
            "Certificados locales ya presentes; se reutilizan sin regeneración.",
        };
      }
    }

    try {
      await this.writeLocalSelfSignedCertificates(certPaths);
      return {
        ok: true,
        message: "Certificados locales autofirmados generados correctamente.",
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
}
