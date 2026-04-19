import fs from "node:fs/promises";
import path from "node:path";

import Ajv from "ajv";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";

describe("env.schema.json", () => {
  it("valida un payload de entorno de producción mínimo esperado", async () => {
    const schemaPath = path.resolve(
      process.cwd(),
      "resources",
      "templates",
      "env.schema.json",
    );
    const schemaRaw = await fs.readFile(schemaPath, "utf8");
    const schema = JSON.parse(schemaRaw) as object;

    const ajv = new Ajv({ allErrors: true, strict: true });
    addFormats(ajv);

    const validate = ajv.compile(schema);

    const sample = {
      NODE_ENV: "production",
      DOMAIN: "smarteconomat.app",
      BACKEND_API_URL: "https://smarteconomat.app/api/v1",
      FRONTEND_API_URL: "https://smarteconomat.app",
      SMARTECONOMAT_ENV_FILE: "/tmp/runtime/.env.prod",
      POSTGRES_USER: "postgres",
      POSTGRES_PASSWORD: "password_segura_1234",
      POSTGRES_DB: "smarteconomat",
      DB_HOST: "db",
      DB_PORT: "5432",
      DB_USERNAME: "postgres",
      DB_PASSWORD: "password_segura_1234",
      DB_DATABASE: "smarteconomat",
      DB_SYNC: "false",
      JWT_SECRET: "jwt_secret_super_seguro_1234567890",
      JWT_EXPIRATION: "7d",
      SEED_DEFAULT_ADMIN_TEMP_PASSWORD: "SmartEconomat2026!",
      SEED_DEFAULT_ADMIN_USER_TEMP_PASSWORD: "SmartEconomat2026!",
      SEED_DEFAULT_ADMIN_USERNAME: "admin",
      SEED_DEFAULT_SUPERADMIN_USERNAME: "superadmin",
      SEED_DEFAULT_SUPERADMIN_TEMP_PASSWORD: "SmartEconomat2026!",
      SEED_DEFAULT_USERS_SYNCED: "false",
      REDIS_PASSWORD: "redis_password_segura_1234",
      INSTANCE_NAME: "smarteconomat-local",
      ADMIN_USERNAME: "admin",
      TIMEZONE: "Europe/Madrid",
      TLS_PROVIDER: "selfsigned",
      TLS_CUSTOM_FULLCHAIN_PATH: "",
      TLS_CUSTOM_PRIVKEY_PATH: "",
      BACKUP_FREQUENCY: "daily",
      BACKUP_RETENTION_DAYS: "30",
      CERTS_DIR: "/tmp/runtime/certs",
      CERTS_WEBROOT_DIR: "/tmp/runtime/certs-webroot",
      VITE_API_PROXY_TARGET: "https://smarteconomat.app/api/v1",
      STARTUP_RUN_MIGRATIONS: "true",
      SENTRY_DSN: "",
      VITE_SENTRY_DSN: "",
      FRONTEND_HTTP_PORT: "80",
      FRONTEND_HTTPS_PORT: "443",
    };

    expect(validate(sample)).toBe(true);
  });
});
