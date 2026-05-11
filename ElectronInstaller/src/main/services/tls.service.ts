import fs from "node:fs/promises";
import path from "node:path";

import type {
  InstallerConfigPayload,
  OperationResult,
} from "@shared/contracts";

import { CertificateService } from "./certificate.service";

export class TLSService {
  constructor(private readonly certificateService = new CertificateService()) {}

  async setup(config: InstallerConfigPayload): Promise<OperationResult> {
    const runtimePath = config.runtimePath;

    if (config.tlsProvider === "none") {
      const cleanupResult =
        await this.certificateService.removeLocalCertificates(runtimePath);

      return cleanupResult.ok
        ? {
            ok: true,
            message:
              "TLS desactivado: se eliminaron certificados locales previos y no se generaron nuevos.",
          }
        : cleanupResult;
    }

    if (config.tlsProvider === "custom") {
      return this.installCustomCertificates(
        runtimePath,
        config.customCertFullchainPath,
        config.customCertPrivkeyPath,
      );
    }

    return this.certificateService.ensureLocalCertificates(runtimePath, {
      overwrite: true,
      domain: config.localHost,
      installToTrustStore: process.platform === "win32",
    });
  }

  private async installCustomCertificates(
    runtimePath: string,
    sourceFullchainPath?: string,
    sourcePrivkeyPath?: string,
  ): Promise<OperationResult> {
    if (!sourceFullchainPath?.trim() || !sourcePrivkeyPath?.trim()) {
      return {
        ok: false,
        message:
          "Para TLS personalizado debes indicar fullchain.pem y privkey.pem.",
        errorCode: "TLS_CUSTOM_CERTS_MISSING",
      };
    }

    const resolvedFullchainSource = path.resolve(sourceFullchainPath.trim());
    const resolvedPrivkeySource = path.resolve(sourcePrivkeyPath.trim());

    try {
      await fs.access(resolvedFullchainSource);
      await fs.access(resolvedPrivkeySource);
    } catch {
      return {
        ok: false,
        message:
          "No se pudieron leer los certificados personalizados seleccionados.",
        errorCode: "TLS_CUSTOM_CERTS_NOT_FOUND",
      };
    }

    const certsDir = path.join(runtimePath, "certs");
    const liveDir = path.join(certsDir, "live", "custom");
    const targetFullchainLive = path.join(liveDir, "fullchain.pem");
    const targetPrivkeyLive = path.join(liveDir, "privkey.pem");
    const targetFullchainStable = path.join(certsDir, "fullchain.pem");
    const targetPrivkeyStable = path.join(certsDir, "privkey.pem");

    await fs.mkdir(liveDir, { recursive: true });
    await fs.copyFile(resolvedFullchainSource, targetFullchainLive);
    await fs.copyFile(resolvedPrivkeySource, targetPrivkeyLive);
    await fs.copyFile(targetFullchainLive, targetFullchainStable);
    await fs.copyFile(targetPrivkeyLive, targetPrivkeyStable);

    try {
      await fs.chmod(targetPrivkeyLive, 0o600);
      await fs.chmod(targetPrivkeyStable, 0o600);
    } catch {
      // Ignore chmod failures on filesystems that do not support POSIX permissions.
    }

    return {
      ok: true,
      message: "Certificados personalizados instalados correctamente.",
    };
  }
}
