import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import type { QueryRunner } from 'typeorm';

import AppDataSource from '../config/typeorm.config';
import {
  rolUsuario,
  UserStatus,
  UserLanguage,
} from '../modules/usuario/enums/usuario.enums';

type BootstrapAdminUserSeed = {
  username: string;
  email: string;
  nombre: string;
  rol: rolUsuario;
  tempPassword: string;
  idioma: UserLanguage;
};

const SEED_TAG = '[seed-bootstrap-admin-users]';

/**
 * Credenciales bootstrap leídas de `process.env` se memorizan una vez por proceso.
 * Sin esto, cada llamada a `resolveBootstrapAdminUsersFromEnv()` generaba contraseñas
 * aleatorias distintas: el upsert guardaba un hash y el siguiente `POST /auth/login`
 * del seed masivo enviaba otra contraseña → 400 y admin/superadmin dejaban de coincidir
 * con `SmartEconomat2026!` aunque estuviera en `.env.example`.
 */
let memoizedBootstrapUsersForProcessEnv:
  | readonly BootstrapAdminUserSeed[]
  | null = null;

function generateSecureTemporaryPassword(): string {
  return randomBytes(18).toString('base64url');
}

function readOptionalEnv(env: NodeJS.ProcessEnv, key: string): string {
  return env[key]?.trim() || '';
}

/**
 * Controla si al re-ejecutar el bootstrap se aplica de nuevo el hash de la contraseña
 * temporal sobre usuarios admin/superadmin que ya existen.
 *
 * - `SEED_BOOTSTRAP_OVERWRITE_EXISTING_ADMIN_PASSWORD` explícita: true/false (también 1/0, yes/no).
 * - Sin variable: **false** en todos los entornos (no pisar contraseñas salvo orden explícita).
 */
export function parseSeedBootstrapOverwriteExistingAdminPassword(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  const raw =
    env.SEED_BOOTSTRAP_OVERWRITE_EXISTING_ADMIN_PASSWORD?.trim().toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'yes') {
    return true;
  }
  if (raw === 'false' || raw === '0' || raw === 'no') {
    return false;
  }
  return false;
}

type FixedMassiveSeedAdminActor = Readonly<{
  username: string;
  email: string;
  password: string;
  nombre: string;
  role: rolUsuario;
}>;

/**
 * Credenciales canónicas del seed masivo alineadas con `resolveBootstrapAdminUsersFromEnv`
 * (una sola lectura → contraseñas aleatorias en dev coherentes entre admin/superadmin).
 */
export function resolveMassiveSeedFixedAdminCredentials(
  env: NodeJS.ProcessEnv = process.env
): Readonly<{
  superAdmin: FixedMassiveSeedAdminActor;
  admin: FixedMassiveSeedAdminActor;
}> {
  const users = resolveBootstrapAdminUsersFromEnv(env);
  const superEntry = users.find((u) => u.rol === rolUsuario.SUPER_ADMIN);
  const adminEntry = users.find((u) => u.rol === rolUsuario.ADMIN);

  if (!superEntry || !adminEntry) {
    throw new Error(
      `${SEED_TAG} Faltan entradas de bootstrap para SUPER_ADMIN o ADMIN.`
    );
  }

  return {
    superAdmin: {
      username: superEntry.username,
      email: superEntry.email,
      password: superEntry.tempPassword,
      nombre: 'Super Administrador Seed',
      role: rolUsuario.SUPER_ADMIN,
    },
    admin: {
      username: adminEntry.username,
      email: adminEntry.email,
      password: adminEntry.tempPassword,
      nombre: 'Administrador Seed',
      role: rolUsuario.ADMIN,
    },
  };
}

function computeBootstrapAdminUsersFromEnv(
  env: NodeJS.ProcessEnv
): readonly BootstrapAdminUserSeed[] {
  const providedLegacyTempPassword = readOptionalEnv(
    env,
    'SEED_DEFAULT_ADMIN_TEMP_PASSWORD'
  );
  /** Compartida con HTTP seed / `ensureBootstrapAdminCredentials`; evita contraseñas aleatorias si solo está definida en `.env`. */
  const sharedBootstrapPlainPassword = readOptionalEnv(
    env,
    'SEED_BOOTSTRAP_ADMIN_PASSWORD'
  );
  const providedAdminTempPassword = readOptionalEnv(
    env,
    'SEED_DEFAULT_ADMIN_USER_TEMP_PASSWORD'
  );
  const providedSuperAdminTempPassword = readOptionalEnv(
    env,
    'SEED_DEFAULT_SUPERADMIN_TEMP_PASSWORD'
  );
  const providedAdminUsername =
    readOptionalEnv(env, 'SEED_DEFAULT_ADMIN_USERNAME') ||
    readOptionalEnv(env, 'ADMIN_USERNAME') ||
    'admin';
  const providedSuperAdminUsername =
    readOptionalEnv(env, 'SEED_DEFAULT_SUPERADMIN_USERNAME') || 'superadmin';
  const providedAdminEmail =
    readOptionalEnv(env, 'SEED_DEFAULT_ADMIN_EMAIL') ||
    'admin@smarteconomat.com';
  const providedSuperAdminEmail =
    readOptionalEnv(env, 'SEED_DEFAULT_SUPERADMIN_EMAIL') ||
    'superadmin@smarteconomat.com';
  const isProductionEnv =
    (env.NODE_ENV || '').trim().toLowerCase() === 'production';
  const hasAnyProvidedTempPassword =
    providedLegacyTempPassword.length > 0 ||
    providedAdminTempPassword.length > 0 ||
    providedSuperAdminTempPassword.length > 0 ||
    sharedBootstrapPlainPassword.length > 0;

  if (isProductionEnv && !hasAnyProvidedTempPassword) {
    throw new Error(
      `${SEED_TAG} En produccion debes definir credenciales temporales para admin/superadmin (SEED_DEFAULT_ADMIN_TEMP_PASSWORD legacy, SEED_BOOTSTRAP_ADMIN_PASSWORD u otras dedicadas).`
    );
  }

  if (
    providedAdminUsername.toLowerCase() ===
    providedSuperAdminUsername.toLowerCase()
  ) {
    throw new Error(
      `${SEED_TAG} Los usernames de admin y superadmin no pueden coincidir.`
    );
  }

  const defaultAdminTempPassword =
    providedAdminTempPassword.length > 0
      ? providedAdminTempPassword
      : providedLegacyTempPassword.length > 0
        ? providedLegacyTempPassword
        : sharedBootstrapPlainPassword.length > 0
          ? sharedBootstrapPlainPassword
          : generateSecureTemporaryPassword();

  const defaultSuperAdminTempPassword =
    providedSuperAdminTempPassword.length > 0
      ? providedSuperAdminTempPassword
      : providedLegacyTempPassword.length > 0
        ? providedLegacyTempPassword
        : sharedBootstrapPlainPassword.length > 0
          ? sharedBootstrapPlainPassword
          : generateSecureTemporaryPassword();

  return [
    {
      username: providedSuperAdminUsername,
      email: providedSuperAdminEmail,
      nombre: 'Super Administrador',
      rol: rolUsuario.SUPER_ADMIN,
      tempPassword: defaultSuperAdminTempPassword,
      idioma: UserLanguage.ES,
    },
    {
      username: providedAdminUsername,
      email: providedAdminEmail,
      nombre: 'Administrador Principal',
      rol: rolUsuario.ADMIN,
      tempPassword: defaultAdminTempPassword,
      idioma: UserLanguage.ES,
    },
  ] as const;
}

/**
 * Expone "resolveBootstrapAdminUsersFromEnv" en smart-economat-backend (Nest).
 * @undefined {NodeJS.ProcessEnv} env - Entrada efectiva esperada por el contrato.
 * @undefined {readonly BootstrapAdminUserSeed[]} Datos efectivos después de ejecutar la operación.
 */
export function resolveBootstrapAdminUsersFromEnv(
  env: NodeJS.ProcessEnv = process.env
): readonly BootstrapAdminUserSeed[] {
  if (env === process.env) {
    if (memoizedBootstrapUsersForProcessEnv === null) {
      memoizedBootstrapUsersForProcessEnv =
        computeBootstrapAdminUsersFromEnv(env);
    }
    return memoizedBootstrapUsersForProcessEnv;
  }

  return computeBootstrapAdminUsersFromEnv(env);
}

function normalizeId(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function resolveRoleIds(
  queryRunner: QueryRunner
): Promise<Map<rolUsuario, string>> {
  const roleIdByName = new Map<rolUsuario, string>();

  for (const roleName of [rolUsuario.SUPER_ADMIN, rolUsuario.ADMIN]) {
    const rows = (await queryRunner.query(
      `SELECT "id"
       FROM "rol"
       WHERE UPPER("nombre") = UPPER($1)
       ORDER BY "created_at" ASC
       LIMIT 1`,
      [roleName]
    )) as Array<{ id?: string }>;

    const roleId = normalizeId(rows[0]?.id);
    if (!roleId) {
      throw new Error(
        `${SEED_TAG} No se encontro el rol ${roleName}. Ejecuta migraciones antes de correr este seeder.`
      );
    }

    roleIdByName.set(roleName, roleId);
  }

  return roleIdByName;
}

async function upsertBootstrapUser(
  queryRunner: QueryRunner,
  seedUser: BootstrapAdminUserSeed,
  plainTemporaryPassword: string,
  overwriteExistingPassword: boolean
): Promise<string> {
  const existingRows = (await queryRunner.query(
    `SELECT "id"
     FROM "usuario"
     WHERE "email" = $1 OR "username" = $2
     ORDER BY "created_at" ASC
     LIMIT 1`,
    [seedUser.email, seedUser.username]
  )) as Array<{ id?: string }>;

  const existingUserId = normalizeId(existingRows[0]?.id);

  if (existingUserId) {
    if (overwriteExistingPassword) {
      const hashedTemporaryPassword = await bcrypt.hash(
        plainTemporaryPassword,
        10
      );
      await queryRunner.query(
        `UPDATE "usuario"
         SET "nombre" = $1,
             "username" = $2,
             "email" = $3,
             "rol" = $4,
             "status" = $5,
             "password" = $6,
             "idioma" = $7,
             "activo" = TRUE,
             "resetPasswordOtp" = NULL,
             "resetPasswordOtpExpires" = NULL,
             "deleted_at" = NULL,
             "deleted_by" = NULL,
             "updated_at" = NOW()
         WHERE "id" = $8`,
        [
          seedUser.nombre,
          seedUser.username,
          seedUser.email,
          seedUser.rol,
          UserStatus.ACTIVE,
          hashedTemporaryPassword,
          seedUser.idioma,
          existingUserId,
        ]
      );
    } else {
      await queryRunner.query(
        `UPDATE "usuario"
         SET "nombre" = $1,
             "username" = $2,
             "email" = $3,
             "rol" = $4,
             "status" = $5,
             "idioma" = $6,
             "activo" = TRUE,
             "deleted_at" = NULL,
             "deleted_by" = NULL,
             "updated_at" = NOW()
         WHERE "id" = $7`,
        [
          seedUser.nombre,
          seedUser.username,
          seedUser.email,
          seedUser.rol,
          UserStatus.ACTIVE,
          seedUser.idioma,
          existingUserId,
        ]
      );
    }

    return existingUserId;
  }

  const hashedTemporaryPassword = await bcrypt.hash(plainTemporaryPassword, 10);

  const insertedRows = (await queryRunner.query(
    `INSERT INTO "usuario" (
      "nombre",
      "username",
      "password",
      "email",
      "rol",
      "status",
      "idioma",
      "must_change_password",
      "activo",
      "resetPasswordOtp",
      "resetPasswordOtpExpires"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, TRUE, NULL, NULL)
    RETURNING "id"`,
    [
      seedUser.nombre,
      seedUser.username,
      hashedTemporaryPassword,
      seedUser.email,
      seedUser.rol,
      UserStatus.ACTIVE,
      seedUser.idioma,
    ]
  )) as Array<{ id?: string }>;

  const insertedUserId = normalizeId(insertedRows[0]?.id);
  if (!insertedUserId) {
    throw new Error(
      `${SEED_TAG} Could not crear el usuario ${seedUser.username}.`
    );
  }

  return insertedUserId;
}

async function ensureUserRoleAssignments(
  queryRunner: QueryRunner,
  userId: string,
  roleId: string
): Promise<void> {
  await queryRunner.query(
    `DELETE FROM "usuario_rol"
     WHERE "usuario_id" = $1
       AND "rol_id" <> $2`,
    [userId, roleId]
  );

  await queryRunner.query(
    `INSERT INTO "usuario_rol" (
      "usuario_id",
      "rol_id",
      "activo"
    ) VALUES ($1, $2, TRUE)
    ON CONFLICT ("usuario_id", "rol_id") DO UPDATE
    SET "activo" = TRUE`,
    [userId, roleId]
  );

  await queryRunner.query(
    `DELETE FROM "usuario_permiso_excluido"
     WHERE "usuario_id" = $1`,
    [userId]
  );
}

/**
 * Expone "runBootstrapAdminUsersSeed" en smart-economat-backend (Nest).
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function runBootstrapAdminUsersSeed(): Promise<void> {
  const defaultUsers = resolveBootstrapAdminUsersFromEnv();
  const overwriteExistingPassword =
    parseSeedBootstrapOverwriteExistingAdminPassword();
  const shouldDestroyDataSource = !AppDataSource.isInitialized;

  if (shouldDestroyDataSource) {
    await AppDataSource.initialize();
  }

  if (!overwriteExistingPassword) {
    console.log(
      `${SEED_TAG} Modo conservador (sin SEED_BOOTSTRAP_OVERWRITE_EXISTING_ADMIN_PASSWORD=true): usuarios admin existentes conservan contraseña y OTP.`
    );
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const roleIdByName = await resolveRoleIds(queryRunner);

    for (const seedUser of defaultUsers) {
      const roleId = roleIdByName.get(seedUser.rol);
      if (!roleId) {
        throw new Error(
          `${SEED_TAG} Could not resolver el rol ${seedUser.rol}.`
        );
      }

      const userId = await upsertBootstrapUser(
        queryRunner,
        seedUser,
        seedUser.tempPassword,
        overwriteExistingPassword
      );

      await ensureUserRoleAssignments(queryRunner, userId, roleId);
    }

    await queryRunner.commitTransaction();
    console.log(
      `${SEED_TAG} Usuarios admin/superadmin asegurados correctamente.`
    );
  } catch (error) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    throw error;
  } finally {
    await queryRunner.release();

    if (shouldDestroyDataSource && AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}
