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
      SMARTECONOMAT_ENV_FILE: "/tmp/runtime/.env.prod",
      BACKEND_PORT: "3000",
      FRONTEND_PORT: "443",
      POSTGRES_USER: "postgres",
      POSTGRES_PASSWORD: "password_segura_1234",
      POSTGRES_DB: "smarteconomat",
      POSTGRES_PORT: "5432",
      DB_HOST: "db",
      DB_SYNC: "false",
      JWT_SECRET: "jwt_secret_super_seguro_1234567890",
      JWT_EXPIRATION: "7d",
      SEED_DEFAULT_ADMIN_TEMP_PASSWORD: "SmartEconomat2026!",
      SEED_DEFAULT_ADMIN_USER_TEMP_PASSWORD: "SmartEconomat2026!",
      SEED_DEFAULT_ADMIN_USERNAME: "admin",
      SEED_DEFAULT_ADMIN_EMAIL: "admin@smarteconomat.com",
      SEED_DEFAULT_SUPERADMIN_USERNAME: "superadmin",
      SEED_DEFAULT_SUPERADMIN_EMAIL: "superadmin@smarteconomat.com",
      SEED_DEFAULT_SUPERADMIN_TEMP_PASSWORD: "SmartEconomat2026!",
      SEED_DEFAULT_USERS_SYNCED: "false",
      REDIS_HOST: "redis",
      REDIS_PORT: "6379",
      REDIS_PASSWORD: "redis_password_segura_1234",
      INSTANCE_NAME: "smarteconomat-local",
      ADMIN_USERNAME: "admin",
      TIMEZONE: "Europe/Madrid",
      I18N_PATH: "",
      I18N_FALLBACK_LANGUAGE: "es",
      TLS_PROVIDER: "selfsigned",
      TLS_CUSTOM_FULLCHAIN_PATH: "",
      TLS_CUSTOM_PRIVKEY_PATH: "",
      TLS_SELF_SIGNED_DAYS: "825",
      LETSENCRYPT_EMAIL: "",
      LETSENCRYPT_DIRECTORY_URL:
        "https://acme-v02.api.letsencrypt.org/directory",
      BACKUP_FREQUENCY: "daily",
      BACKUP_RETENTION_DAYS: "30",
      CERTS_DIR: "/tmp/runtime/certs",
      CERTS_WEBROOT_DIR: "/tmp/runtime/certs-webroot",
      STARTUP_RUN_MIGRATIONS: "true",
      RUN_BOOTSTRAP_SEEDER: "true",
      SENTRY_DSN: "",
      VITE_SENTRY_DSN: "",
      FRONTEND_HTTP_PORT: "80",
      FRONTEND_HTTPS_PORT: "443",
      MAIL_HOST: "",
      MAIL_PORT: "",
      MAIL_USER: "",
      MAIL_PASS: "",
      MAIL_SECURE: "false",
      MAIL_FROM: "noreply@smarteconomat.app",
      OPEN_FOOD_FACTS_PROXY_REQUEST_DELAY_MS: "1200",
      OPEN_FOOD_FACTS_REQUEST_DELAY_MS: "",
      OPEN_FOOD_FACTS_PROXY_TIMEOUT_MS: "15000",
      OPEN_FOOD_FACTS_TIMEOUT_MS: "",
      OPEN_FOOD_FACTS_IMAGE_TIMEOUT_MS: "20000",
      OFF_API_ENABLED: "false",
      LOCAL_STORAGE_PATH: "./uploads",
      SEED_BOOTSTRAP_ADMIN_EMAIL: "",
      SEED_BOOTSTRAP_ADMIN_USERNAME: "superadmin",
      SEED_BOOTSTRAP_ADMIN_PASSWORD: "",
      SEED_API_BASE_URL: "",
      SEED_DOCKER_COMPOSE_FILE: "",
      SEED_LOG_DIR: "",
      SEED_MOVIMIENTOS_GET_ONLY: "",
      SEED_MOVIMIENTOS_GET: "",
      SEED_ONLY_DOMAIN: "",
      SEED_RUN_TAG: "",
      SEED_MULTIPLIER: "",
      SEEDER_LANG: "es",
      IS_SEEDING: "false",
    };

    expect(validate(sample)).toBe(true);
  });
});
