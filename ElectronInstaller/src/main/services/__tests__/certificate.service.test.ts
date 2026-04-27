import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CertificateService } from "../certificate.service";

describe("CertificateService", () => {
  it("genera certificados locales autofirmados en runtime/certs", async () => {
    const runtimePath = await fs.mkdtemp(
      path.join(os.tmpdir(), "smarteconomat-cert-"),
    );

    const service = new CertificateService();
    const result = await service.ensureLocalCertificates(runtimePath, {
      overwrite: true,
    });

    expect(result.ok).toBe(true);

    const fullchainPath = path.join(
      runtimePath,
      "certs",
      "fullchain.pem",
    );
    const privkeyPath = path.join(runtimePath, "certs", "privkey.pem");

    const [fullchain, privkey] = await Promise.all([
      fs.readFile(fullchainPath, "utf8"),
      fs.readFile(privkeyPath, "utf8"),
    ]);

    expect(fullchain).toContain("BEGIN CERTIFICATE");
    expect(privkey).toMatch(/BEGIN (RSA )?PRIVATE KEY/);
  });

  it("reutiliza certificados existentes cuando no se fuerza regeneración", async () => {
    const runtimePath = await fs.mkdtemp(
      path.join(os.tmpdir(), "smarteconomat-cert-existing-"),
    );

    const certsDir = path.join(
      runtimePath,
      "certs",
      "live",
      "local-smarteconomat",
    );
    await fs.mkdir(certsDir, { recursive: true });
    await fs.mkdir(path.join(runtimePath, "certs"), { recursive: true });

    const fullchainPath = path.join(certsDir, "fullchain.pem");
    const privkeyPath = path.join(certsDir, "privkey.pem");
    const stableFullchainPath = path.join(
      runtimePath,
      "certs",
      "fullchain.pem",
    );
    const stablePrivkeyPath = path.join(runtimePath, "certs", "privkey.pem");

    await Promise.all([
      fs.writeFile(fullchainPath, "CERT", "utf8"),
      fs.writeFile(privkeyPath, "KEY", "utf8"),
      fs.writeFile(stableFullchainPath, "CERT", "utf8"),
      fs.writeFile(stablePrivkeyPath, "KEY", "utf8"),
    ]);

    const service = new CertificateService();
    const result = await service.ensureLocalCertificates(runtimePath, {
      overwrite: false,
    });

    expect(result.ok).toBe(true);
    expect(result.message).toContain("reutilizan");
  });
});