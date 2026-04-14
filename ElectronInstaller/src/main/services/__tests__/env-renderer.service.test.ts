import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import type { InstallerConfigPayload } from "@shared/contracts";

import { EnvRendererService } from "../env-renderer.service";
import { PathResolverService } from "../path-resolver.service";

const baseConfig: InstallerConfigPayload = {
  runtimePath: "/tmp/smarteconomat-runtime-test",
  instanceName: "smarteconomat-local",
  adminUsername: "admin",
  adminPassword: "AdminTemporal2026",
  superAdminUsername: "superadmin",
  superAdminPassword: "SuperAdminTemporal2026",
  useSamePasswordForBoth: false,
  localHost: "smarteconomat.app",
  timezone: "Europe/Madrid",
  tlsProvider: "selfsigned",
  customCertFullchainPath: "",
  customCertPrivkeyPath: "",
  backupFrequency: "daily",
  backupRetentionDays: 30,
};

describe("EnvRendererService", () => {
  it("genera .env.prod con secretos y schema válido", async () => {
    const runtimePath = await fs.mkdtemp(
      path.join(os.tmpdir(), "smarteconomat-env-"),
    );

    const resolverStub = {
      getTemplatesRoot: () =>
        path.resolve(process.cwd(), "resources", "templates"),
    } as unknown as PathResolverService;

    const service = new EnvRendererService(resolverStub);
    const result = await service.render({ ...baseConfig, runtimePath });

    expect(result.ok).toBe(true);
    expect(result.data?.envFilePath).toBe(path.join(runtimePath, ".env.prod"));

    const rendered = await fs.readFile(
      path.join(runtimePath, ".env.prod"),
      "utf8",
    );
    expect(rendered).toContain("REDIS_PASSWORD=");
    expect(rendered).toContain("CERTS_DIR=");
    expect(rendered).toContain("NODE_ENV=production");
  });

  it("falla con password débil de admin", async () => {
    const resolverStub = {
      getTemplatesRoot: () =>
        path.resolve(process.cwd(), "resources", "templates"),
    } as unknown as PathResolverService;

    const service = new EnvRendererService(resolverStub);
    const result = await service.render({
      ...baseConfig,
      adminPassword: "debil",
    });

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("ADMIN_PASSWORD_WEAK");
  });
});
