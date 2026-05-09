import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import type { InstallerConfigPayload } from "@shared/contracts";

import { TLSService } from "../tls.service";

const baseConfig: InstallerConfigPayload = {
  runtimePath: "",
  instanceName: "smarteconomat-local",
  adminUsername: "admin",
  adminPassword: "SmartEconomat2026!",
  superAdminUsername: "superadmin",
  superAdminPassword: "SmartEconomat2026!",
  useSamePasswordForBoth: false,
  localHost: "smarteconomat.app",
  timezone: "Europe/Madrid",
  tlsProvider: "selfsigned",
  customCertFullchainPath: "",
  customCertPrivkeyPath: "",
  backupFrequency: "daily",
  backupRetentionDays: 30,
};

describe("TLSService", () => {
  it("genera certificados aunque el modo sea none y no existan archivos previos", async () => {
    const runtimePath = await fs.mkdtemp(
      path.join(os.tmpdir(), "smarteconomat-tls-none-"),
    );

    const service = new TLSService();
    const result = await service.setup({
      ...baseConfig,
      runtimePath,
      tlsProvider: "none",
    });

    expect(result.ok).toBe(true);

    const fullchain = await fs.readFile(
      path.join(runtimePath, "certs", "fullchain.pem"),
      "utf8",
    );
    expect(fullchain).toContain("BEGIN CERTIFICATE");
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
