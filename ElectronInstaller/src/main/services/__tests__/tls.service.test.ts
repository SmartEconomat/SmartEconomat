import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import type { InstallerConfigPayload } from "@shared/contracts";

import { TLSService } from "../tls.service";

const baseConfig: InstallerConfigPayload = {
  runtimePath: "",
  instanceName: "smarteconomat-local",
  installMode: "new",
  adminUsername: "admin",
  adminPassword: "SmartEconomat2026!",
  superAdminUsername: "superadmin",
  superAdminPassword: "SmartEconomat2026!",
  verifyExistingAdminSession: true,
  repairAdminCredentialsOnFailure: true,
  useSamePasswordForBoth: false,
  localHost: "smarteconomat.app",
  timezone: "Europe/Madrid",
  tlsProvider: "selfsigned",
  customCertFullchainPath: "",
  customCertPrivkeyPath: "",
  backupDefaultDirectory: "/tmp/smarteconomat-runtime-test/backups",
  backupFrequency: "daily",
  backupScheduleTime: "02:00",
  backupRetentionDays: 30,
  httpPort: 80,
  httpsPort: 443,
};

describe("TLSService", () => {
  it("no genera certificados cuando el modo es none", async () => {
    const runtimePath = await fs.mkdtemp(
      path.join(os.tmpdir(), "smarteconomat-tls-none-"),
    );

    const certsDir = path.join(runtimePath, "certs");
    await fs.mkdir(path.join(certsDir, "live", "local-smarteconomat"), {
      recursive: true,
    });
    await fs.mkdir(path.join(runtimePath, "certs-webroot"), {
      recursive: true,
    });
    await Promise.all([
      fs.writeFile(
        path.join(certsDir, "live", "local-smarteconomat", "fullchain.pem"),
        "CERT",
        "utf8",
      ),
      fs.writeFile(
        path.join(certsDir, "live", "local-smarteconomat", "privkey.pem"),
        "KEY",
        "utf8",
      ),
      fs.writeFile(path.join(certsDir, "fullchain.pem"), "CERT", "utf8"),
      fs.writeFile(path.join(certsDir, "privkey.pem"), "KEY", "utf8"),
    ]);

    const service = new TLSService();
    const result = await service.setup({
      ...baseConfig,
      runtimePath,
      tlsProvider: "none",
    });

    expect(result.ok).toBe(true);
    await expect(
      fs.access(path.join(runtimePath, "certs", "fullchain.pem")),
    ).rejects.toBeDefined();
    await expect(
      fs.access(path.join(runtimePath, "certs-webroot")),
    ).rejects.toBeDefined();
  });

  it("genera certificados autofirmados cuando el modo es selfsigned", async () => {
    const runtimePath = await fs.mkdtemp(
      path.join(os.tmpdir(), "smarteconomat-tls-selfsigned-"),
    );

    const service = new TLSService();
    const result = await service.setup({
      ...baseConfig,
      runtimePath,
      tlsProvider: "selfsigned",
    });

    expect(result.ok).toBe(true);
  });
});
