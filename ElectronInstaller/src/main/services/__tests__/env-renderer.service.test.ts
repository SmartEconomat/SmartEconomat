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
  installMode: "new",
  adminUsername: "admin",
  adminPassword: "SmartEconomat2026!",
  adminEmail: "admin@smarteconomat.com",
  superAdminUsername: "superadmin",
  superAdminPassword: "SmartEconomat2026!",
  superAdminEmail: "superadmin@smarteconomat.com",
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
    const snapshot = await fs.readFile(
      path.join(runtimePath, ".env.prod.snapshot.json"),
      "utf8",
    );

    expect(rendered).toContain("REDIS_PASSWORD=");
    expect(rendered).toContain("CERTS_DIR=");
    expect(rendered).toContain("NODE_ENV=production");
    expect(rendered).toContain("SMARTECONOMAT_ENV_FILE=");
    expect(snapshot).toContain("envMap");
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

  it("regenera .env.prod desde snapshot cuando el archivo falta", async () => {
    const runtimePath = await fs.mkdtemp(
      path.join(os.tmpdir(), "smarteconomat-env-recovery-"),
    );

    const resolverStub = {
      getTemplatesRoot: () =>
        path.resolve(process.cwd(), "resources", "templates"),
    } as unknown as PathResolverService;

    const service = new EnvRendererService(resolverStub);
    const initial = await service.render({ ...baseConfig, runtimePath });
    expect(initial.ok).toBe(true);

    await fs.unlink(path.join(runtimePath, ".env.prod"));

    const regenerated = await service.regenerateFromSnapshot(runtimePath);
    expect(regenerated.ok).toBe(true);

    const rendered = await fs.readFile(
      path.join(runtimePath, ".env.prod"),
      "utf8",
    );
    expect(rendered).toContain("NODE_ENV=production");
    expect(rendered).toContain("POSTGRES_PASSWORD=");
  });

  it("reutiliza secretos existentes del runtime cuando no se proporcionan", async () => {
    const runtimePath = await fs.mkdtemp(
      path.join(os.tmpdir(), "smarteconomat-env-secrets-reuse-"),
    );

    const resolverStub = {
      getTemplatesRoot: () =>
        path.resolve(process.cwd(), "resources", "templates"),
    } as unknown as PathResolverService;

    await fs.writeFile(
      path.join(runtimePath, ".env.prod"),
      [
        "POSTGRES_PASSWORD=PersistedPostgresPassword_2026_Strong",
        "REDIS_PASSWORD=PersistedRedisPassword_2026_Strong",
        "JWT_SECRET=PersistedJwtSecret_2026_Strong_Long_Value",
      ].join("\n"),
      "utf8",
    );

    const service = new EnvRendererService(resolverStub);
    const result = await service.render({ ...baseConfig, runtimePath });

    expect(result.ok).toBe(true);
    expect(result.data?.envMap.POSTGRES_PASSWORD).toBe(
      "PersistedPostgresPassword_2026_Strong",
    );
    expect(result.data?.envMap.REDIS_PASSWORD).toBe(
      "PersistedRedisPassword_2026_Strong",
    );
    expect(result.data?.envMap.JWT_SECRET).toBe(
      "PersistedJwtSecret_2026_Strong_Long_Value",
    );
  });
});
