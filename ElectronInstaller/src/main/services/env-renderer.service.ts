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

export class EnvRendererService {
  private readonly ajv: Ajv;

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

    const envMap = this.buildEnvMap(config);

    if (!validate(envMap)) {
      return {
        ok: false,
        message: "Validación de env.schema.json falló.",
        errorCode: "ENV_SCHEMA_INVALID",
        data: undefined,
      };
    }

    const rendered = this.renderTemplate(templateRaw, envMap);

    await fs.mkdir(config.runtimePath, { recursive: true });
    const envFilePath = path.join(config.runtimePath, ".env.prod");
    await fs.writeFile(envFilePath, rendered, {
      encoding: "utf8",
      mode: 0o600,
    });

    const secretsToMask = [
      envMap.POSTGRES_PASSWORD,
      envMap.REDIS_PASSWORD,
      envMap.JWT_SECRET,
      envMap.SEED_DEFAULT_ADMIN_TEMP_PASSWORD,
      envMap.SEED_DEFAULT_SUPERADMIN_TEMP_PASSWORD,
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

  private buildEnvMap(config: InstallerConfigPayload): Record<string, string> {
    const postgresPassword =
      config.postgresPassword && config.postgresPassword.trim().length > 0
        ? config.postgresPassword.trim()
        : this.secretStore.generateSecret(32);

    const redisPassword =
      config.redisPassword && config.redisPassword.trim().length > 0
        ? config.redisPassword.trim()
        : this.secretStore.generateSecret(32);

    const jwtSecret =
      config.jwtSecret && config.jwtSecret.trim().length > 0
        ? config.jwtSecret.trim()
        : this.secretStore.generateSecret(48);

    const domain = config.localHost.trim();
    const superAdminPassword = config.useSamePasswordForBoth
      ? config.adminPassword
      : config.superAdminPassword;

    return {
      NODE_ENV: "production",
      DOMAIN: domain,
      BACKEND_API_URL: `https://${domain}/api/v1`,
      FRONTEND_API_URL: `https://${domain}`,
      POSTGRES_USER: "postgres",
      POSTGRES_PASSWORD: postgresPassword,
      POSTGRES_DB: "smarteconomat",
      DB_HOST: "db",
      DB_PORT: "5432",
      DB_USERNAME: "postgres",
      DB_PASSWORD: postgresPassword,
      DB_DATABASE: "smarteconomat",
      DB_SYNC: "false",
      JWT_SECRET: jwtSecret,
      JWT_EXPIRATION: "7d",
      SEED_DEFAULT_ADMIN_TEMP_PASSWORD: config.adminPassword,
      SEED_DEFAULT_ADMIN_USER_TEMP_PASSWORD: config.adminPassword,
      SEED_DEFAULT_ADMIN_USERNAME: config.adminUsername,
      SEED_DEFAULT_SUPERADMIN_USERNAME: config.superAdminUsername,
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
}
