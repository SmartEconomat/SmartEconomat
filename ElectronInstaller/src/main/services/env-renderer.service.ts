import fs from "node:fs/promises";
import path from "node:path";

import Ajv from "ajv";
import addFormats from "ajv-formats";

import type {
  InstallerConfigPayload,
  OperationResult,
} from "@shared/contracts";

import { SecretStoreService } from "@main/security/secret-store.service";

import { PathResolverService } from "./path-resolver.service";

interface EnvRenderResult {
  envFilePath: string;
  maskedPreview: string;
  envMap: Record<string, string>;
}

interface EnvSnapshotFile {
  createdAt: string;
  envMap: Record<string, string>;
}

interface PersistedSecrets {
  POSTGRES_PASSWORD?: string;
  REDIS_PASSWORD?: string;
  JWT_SECRET?: string;
}

export class EnvRendererService {
  private readonly ajv: Ajv;
  private readonly envFileName = ".env.prod";
  private readonly snapshotFileName = ".env.prod.snapshot.json";

  constructor(
    private readonly pathResolver = new PathResolverService(),
    private readonly secretStore = new SecretStoreService(),
  ) {
    this.ajv = new Ajv({ allErrors: true, strict: true });
    addFormats(this.ajv);
  }

  async render(
    config: InstallerConfigPayload,
  ): Promise<OperationResult<EnvRenderResult>> {
    const customValidation = this.validateBusinessRules(config);
    if (!customValidation.ok) {
      return customValidation;
    }

    const templatesRoot = this.pathResolver.getTemplatesRoot();
    const templatePath = path.join(templatesRoot, "env.template.prod");
    const schemaPath = path.join(templatesRoot, "env.schema.json");

    const [templateRaw, schemaRaw] = await Promise.all([
      fs.readFile(templatePath, "utf8"),
      fs.readFile(schemaPath, "utf8"),
    ]);

    const schema = JSON.parse(schemaRaw) as object;
    const validate = this.ajv.compile(schema);

    const persistedSecrets = await this.loadPersistedSecrets(
      config.runtimePath,
    );
    const envMap = this.buildEnvMap(config, persistedSecrets);

    if (!validate(envMap)) {
      console.error("[ENV-RENDERER] Validation errors:", validate.errors);
      return {
        ok: false,
        message: "Validación de env.schema.json falló: " + JSON.stringify(validate.errors),
        errorCode: "ENV_SCHEMA_INVALID",
        data: undefined,
      };
    }

    const rendered = this.renderTemplate(templateRaw, envMap);

    await fs.mkdir(config.runtimePath, { recursive: true });
    const envFilePath = path.join(config.runtimePath, this.envFileName);
    await fs.writeFile(envFilePath, rendered, {
      encoding: "utf8",
      mode: 0o600,
    });
    await this.writeSnapshot(config.runtimePath, envMap);

    const secretsToMask = [
      envMap.POSTGRES_PASSWORD,
      envMap.REDIS_PASSWORD,
      envMap.JWT_SECRET,
      envMap.SEED_DEFAULT_ADMIN_TEMP_PASSWORD,
      envMap.SEED_DEFAULT_SUPERADMIN_TEMP_PASSWORD,
      envMap.MAIL_PASS,
    ].filter((value): value is string => typeof value === "string");

    return {
      ok: true,
      message: ".env.prod generado correctamente.",
      data: {
        envFilePath,
        envMap,
        maskedPreview: this.secretStore.maskText(rendered, secretsToMask),
      },
    };
  }

  async regenerateFromSnapshot(runtimePath: string): Promise<OperationResult> {
    try {
      const snapshotPath = this.getSnapshotPath(runtimePath);
      const snapshotRaw = await fs.readFile(snapshotPath, "utf8");
      const snapshot = JSON.parse(snapshotRaw) as EnvSnapshotFile;

      if (!snapshot.envMap || typeof snapshot.envMap !== "object") {
        return {
          ok: false,
          message: "Snapshot de entorno inválido o corrupto.",
          errorCode: "ENV_SNAPSHOT_INVALID",
        };
      }

      const templatesRoot = this.pathResolver.getTemplatesRoot();
      const templatePath = path.join(templatesRoot, "env.template.prod");
      const schemaPath = path.join(templatesRoot, "env.schema.json");
      const [templateRaw, schemaRaw] = await Promise.all([
        fs.readFile(templatePath, "utf8"),
        fs.readFile(schemaPath, "utf8"),
      ]);

      const schema = JSON.parse(schemaRaw) as object;
      const validate = this.ajv.compile(schema);
      if (!validate(snapshot.envMap)) {
        return {
          ok: false,
          message: "Snapshot no supera la validación de env.schema.json.",
          errorCode: "ENV_SNAPSHOT_SCHEMA_INVALID",
        };
      }

      const rendered = this.renderTemplate(templateRaw, snapshot.envMap);
      await fs.mkdir(runtimePath, { recursive: true });
      await fs.writeFile(path.join(runtimePath, this.envFileName), rendered, {
        encoding: "utf8",
        mode: 0o600,
      });

      return {
        ok: true,
        message: ".env.prod regenerado correctamente desde snapshot seguro.",
      };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "No se pudo regenerar .env.prod desde snapshot.",
        errorCode: "ENV_SNAPSHOT_NOT_FOUND",
      };
    }
  }

  private validateBusinessRules(
    config: InstallerConfigPayload,
  ): OperationResult<EnvRenderResult> {
    const normalizedAdminUsername = config.adminUsername.trim();
    const normalizedSuperAdminUsername = config.superAdminUsername.trim();

    if (config.adminUsername.trim().length < 4) {
      return {
        ok: false,
        message: "El usuario admin debe tener al menos 4 caracteres.",
        errorCode: "ADMIN_USERNAME_INVALID",
      };
    }

    if (normalizedSuperAdminUsername.length < 4) {
      return {
        ok: false,
        message: "El usuario superadmin debe tener al menos 4 caracteres.",
        errorCode: "SUPERADMIN_USERNAME_INVALID",
      };
    }

    if (
      normalizedAdminUsername.toLowerCase() ===
      normalizedSuperAdminUsername.toLowerCase()
    ) {
      return {
        ok: false,
        message:
          "Admin y superadmin deben tener nombres de usuario diferentes.",
        errorCode: "DEFAULT_USERS_COLLISION",
      };
    }

    if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{12,}$/.test(config.adminPassword)) {
      return {
        ok: false,
        message:
          "La contraseña admin requiere 12+ caracteres con mayúsculas, minúsculas y números.",
        errorCode: "ADMIN_PASSWORD_WEAK",
      };
    }

    if (
      !/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{12,}$/.test(config.superAdminPassword)
    ) {
      return {
        ok: false,
        message:
          "La contraseña de superadmin requiere 12+ caracteres con mayúsculas, minúsculas y números.",
        errorCode: "SUPERADMIN_PASSWORD_WEAK",
      };
    }

    if (
      config.useSamePasswordForBoth &&
      config.adminPassword !== config.superAdminPassword
    ) {
      return {
        ok: false,
        message:
          "Con la sincronización activa, las contraseñas de admin y superadmin deben coincidir.",
        errorCode: "DEFAULT_USERS_PASSWORD_MISMATCH",
      };
    }

    if (
      config.tlsProvider === "custom" &&
      (!config.customCertFullchainPath?.trim() ||
        !config.customCertPrivkeyPath?.trim())
    ) {
      return {
        ok: false,
        message:
          "Debes indicar fullchain.pem y privkey.pem para TLS personalizado.",
        errorCode: "TLS_CUSTOM_PATHS_REQUIRED",
      };
    }

    if (config.backupRetentionDays < 1 || config.backupRetentionDays > 365) {
      return {
        ok: false,
        message: "La retención de backup debe estar entre 1 y 365 días.",
        errorCode: "BACKUP_RETENTION_INVALID",
      };
    }

    return {
      ok: true,
      message: "Configuración de negocio válida.",
    };
  }

  private buildEnvMap(
    config: InstallerConfigPayload,
    persistedSecrets: PersistedSecrets,
  ): Record<string, string> {
    const postgresPassword =
      config.postgresPassword && config.postgresPassword.trim().length > 0
        ? config.postgresPassword.trim()
        : (persistedSecrets.POSTGRES_PASSWORD ??
          this.secretStore.generateSecret(32));

    const redisPassword =
      config.redisPassword && config.redisPassword.trim().length > 0
        ? config.redisPassword.trim()
        : (persistedSecrets.REDIS_PASSWORD ??
          this.secretStore.generateSecret(32));

    const jwtSecret =
      config.jwtSecret && config.jwtSecret.trim().length > 0
        ? config.jwtSecret.trim()
        : (persistedSecrets.JWT_SECRET ?? this.secretStore.generateSecret(48));

    const requestedHost = config.localHost.trim();
    const effectiveHost = requestedHost || "localhost";
    const protocol = config.tlsProvider === "none" ? "http" : "https";
    const backendApiUrl = `${protocol}://${effectiveHost}/api/v1`;
    const superAdminPassword = config.useSamePasswordForBoth
      ? config.adminPassword
      : config.superAdminPassword;
    const envFilePath = path
      .join(config.runtimePath, this.envFileName)
      .replaceAll("\\", "/");

    return {
      NODE_ENV: "production",
      DOMAIN: effectiveHost,
      SMARTECONOMAT_ENV_FILE: envFilePath,
      POSTGRES_USER: "postgres",
      POSTGRES_PASSWORD: postgresPassword,
      POSTGRES_DB: "smarteconomat",
      POSTGRES_PORT: "5432",
      DB_HOST: "db",
      DB_SYNC: "false",
      JWT_SECRET: jwtSecret,
      JWT_EXPIRATION: "7d",
      SEED_DEFAULT_ADMIN_TEMP_PASSWORD: config.adminPassword,
      SEED_DEFAULT_ADMIN_USER_TEMP_PASSWORD: config.adminPassword,
      SEED_DEFAULT_ADMIN_USERNAME: config.adminUsername,
      SEED_DEFAULT_ADMIN_EMAIL: config.adminEmail || "admin@smarteconomat.com",
      SEED_DEFAULT_SUPERADMIN_USERNAME: config.superAdminUsername,
      SEED_DEFAULT_SUPERADMIN_EMAIL:
        config.superAdminEmail || "superadmin@smarteconomat.com",
      SEED_DEFAULT_SUPERADMIN_TEMP_PASSWORD: superAdminPassword,
      SEED_DEFAULT_USERS_SYNCED: String(config.useSamePasswordForBoth),
      REDIS_PASSWORD: redisPassword,
      INSTANCE_NAME: config.instanceName,
      ADMIN_USERNAME: config.adminUsername,
      TIMEZONE: config.timezone,
      TLS_PROVIDER: config.tlsProvider,
      TLS_CUSTOM_FULLCHAIN_PATH: config.customCertFullchainPath?.trim() ?? "",
      TLS_CUSTOM_PRIVKEY_PATH: config.customCertPrivkeyPath?.trim() ?? "",
      BACKUP_FREQUENCY: config.backupFrequency,
      BACKUP_RETENTION_DAYS: String(config.backupRetentionDays),
      CERTS_DIR: path.join(config.runtimePath, "certs"),
      CERTS_WEBROOT_DIR: path.join(config.runtimePath, "certs-webroot"),
      STARTUP_RUN_MIGRATIONS:
        config.startupRunMigrations === false ? "false" : "true",
      RUN_BOOTSTRAP_SEEDER: config.installMode === "new" ? "true" : "false",
      SENTRY_DSN: config.sentryDsn?.trim() ?? "",
      VITE_SENTRY_DSN: config.viteSentryDsn?.trim() ?? "",
      FRONTEND_HTTP_PORT: String(config.httpPort),
      FRONTEND_HTTPS_PORT: String(config.httpsPort),
      MAIL_HOST: config.smtpHost?.trim() ?? "",
      MAIL_PORT: config.smtpPort?.trim() ?? "",
      MAIL_USER: config.smtpUser?.trim() ?? "",
      MAIL_PASS: config.smtpPass?.trim() ?? "",
      MAIL_SECURE: String(config.smtpSecure ?? false),
    };
  }

  private renderTemplate(
    templateRaw: string,
    envMap: Record<string, string>,
  ): string {
    return Object.entries(envMap).reduce((result, [key, value]) => {
      return result.replaceAll(`{{${key}}}`, value);
    }, templateRaw);
  }

  private getSnapshotPath(runtimePath: string): string {
    return path.join(runtimePath, this.snapshotFileName);
  }

  private async writeSnapshot(
    runtimePath: string,
    envMap: Record<string, string>,
  ): Promise<void> {
    const snapshot: EnvSnapshotFile = {
      createdAt: new Date().toISOString(),
      envMap,
    };

    await fs.writeFile(
      this.getSnapshotPath(runtimePath),
      JSON.stringify(snapshot),
      {
        encoding: "utf8",
        mode: 0o600,
      },
    );
  }

  private async loadPersistedSecrets(
    runtimePath: string,
  ): Promise<PersistedSecrets> {
    const fromEnv = await this.loadSecretsFromEnvFile(runtimePath);
    const fromSnapshot = await this.loadSecretsFromSnapshot(runtimePath);

    return {
      POSTGRES_PASSWORD:
        fromEnv.POSTGRES_PASSWORD ?? fromSnapshot.POSTGRES_PASSWORD,
      REDIS_PASSWORD: fromEnv.REDIS_PASSWORD ?? fromSnapshot.REDIS_PASSWORD,
      JWT_SECRET: fromEnv.JWT_SECRET ?? fromSnapshot.JWT_SECRET,
    };
  }

  private async loadSecretsFromEnvFile(
    runtimePath: string,
  ): Promise<PersistedSecrets> {
    try {
      const envPath = path.join(runtimePath, this.envFileName);
      const raw = await fs.readFile(envPath, "utf8");
      const parsed = this.parseEnv(raw);

      return {
        POSTGRES_PASSWORD: parsed.POSTGRES_PASSWORD ?? undefined,
        REDIS_PASSWORD: parsed.REDIS_PASSWORD ?? undefined,
        JWT_SECRET: parsed.JWT_SECRET ?? undefined,
      };
    } catch {
      return {};
    }
  }

  private async loadSecretsFromSnapshot(
    runtimePath: string,
  ): Promise<PersistedSecrets> {
    try {
      const snapshotPath = this.getSnapshotPath(runtimePath);
      const raw = await fs.readFile(snapshotPath, "utf8");
      const snapshot = JSON.parse(raw) as EnvSnapshotFile;

      return {
        POSTGRES_PASSWORD: snapshot.envMap.POSTGRES_PASSWORD,
        REDIS_PASSWORD: snapshot.envMap.REDIS_PASSWORD,
        JWT_SECRET: snapshot.envMap.JWT_SECRET,
      };
    } catch {
      return {};
    }
  }

  private parseEnv(raw: string): Record<string, string> {
    const result: Record<string, string> = {};

    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed.length === 0 || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      if (key.length === 0) {
        continue;
      }

      result[key] = value;
    }

    return result;
  }
}
