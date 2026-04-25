import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import type { QueryRunner } from 'typeorm';

import AppDataSource from '../config/typeorm.config';
import { rolUsuario, UserStatus } from '../modules/usuario/enums/usuario.enums';

type BootstrapAdminUserSeed = {
  username: string;
  email: string;
  nombre: string;
  rol: rolUsuario;
  tempPassword: string;
};

const SEED_TAG = '[seed-bootstrap-admin-users]';

function generateSecureTemporaryPassword(): string {
  return randomBytes(18).toString('base64url');
}

function readOptionalEnv(env: NodeJS.ProcessEnv, key: string): string {
  return env[key]?.trim() || '';
}

export function resolveBootstrapAdminUsersFromEnv(
  env: NodeJS.ProcessEnv = process.env
): readonly BootstrapAdminUserSeed[] {
  const providedLegacyTempPassword = readOptionalEnv(
    env,
    'SEED_DEFAULT_ADMIN_TEMP_PASSWORD'
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
    providedSuperAdminTempPassword.length > 0;

  if (isProductionEnv && !hasAnyProvidedTempPassword) {
    throw new Error(
      `${SEED_TAG} En produccion debes definir credenciales temporales para admin/superadmin (SEED_DEFAULT_ADMIN_TEMP_PASSWORD legacy o variables dedicadas).`
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
        : generateSecureTemporaryPassword();

  const defaultSuperAdminTempPassword =
    providedSuperAdminTempPassword.length > 0
      ? providedSuperAdminTempPassword
      : providedLegacyTempPassword.length > 0
        ? providedLegacyTempPassword
        : generateSecureTemporaryPassword();

  return [
    {
      username: providedSuperAdminUsername,
      email: providedSuperAdminEmail,
      nombre: 'Super Administrador',
      rol: rolUsuario.SUPER_ADMIN,
      tempPassword: defaultSuperAdminTempPassword,
    },
    {
      username: providedAdminUsername,
      email: providedAdminEmail,
      nombre: 'Administrador Principal',
      rol: rolUsuario.ADMIN,
      tempPassword: defaultAdminTempPassword,
    },
  ] as const;
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
  hashedTemporaryPassword: string
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
    await queryRunner.query(
      `UPDATE "usuario"
       SET "nombre" = $1,
           "username" = $2,
           "email" = $3,
           "rol" = $4,
           "status" = $5,
           "activo" = TRUE,
           "resetPasswordOtp" = NULL,
           "resetPasswordOtpExpires" = NULL,
           "deleted_at" = NULL,
           "deleted_by" = NULL,
           "updated_at" = NOW()
       WHERE "id" = $6`,
      [
        seedUser.nombre,
        seedUser.username,
        seedUser.email,
        seedUser.rol,
        UserStatus.ACTIVE,
        existingUserId,
      ]
    );

    return existingUserId;
  }

  const insertedRows = (await queryRunner.query(
    `INSERT INTO "usuario" (
      "nombre",
      "username",
      "password",
      "email",
      "rol",
      "status",
      "must_change_password",
      "activo",
      "resetPasswordOtp",
      "resetPasswordOtpExpires"
    ) VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE, NULL, NULL)
    RETURNING "id"`,
    [
      seedUser.nombre,
      seedUser.username,
      hashedTemporaryPassword,
      seedUser.email,
      seedUser.rol,
      UserStatus.ACTIVE,
    ]
  )) as Array<{ id?: string }>;

  const insertedUserId = normalizeId(insertedRows[0]?.id);
  if (!insertedUserId) {
    throw new Error(
      `${SEED_TAG} No se pudo crear el usuario ${seedUser.username}.`
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

export async function runBootstrapAdminUsersSeed(): Promise<void> {
  const defaultUsers = resolveBootstrapAdminUsersFromEnv();
  const shouldDestroyDataSource = !AppDataSource.isInitialized;

  if (shouldDestroyDataSource) {
    await AppDataSource.initialize();
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
          `${SEED_TAG} No se pudo resolver el rol ${seedUser.rol}.`
        );
      }

      const hashedTemporaryPassword = await bcrypt.hash(
        seedUser.tempPassword,
        10
      );

      const userId = await upsertBootstrapUser(
        queryRunner,
        seedUser,
        hashedTemporaryPassword
      );

      await ensureUserRoleAssignments(queryRunner, userId, roleId);
    }

    await queryRunner.commitTransaction();
    console.log(
      `${SEED_TAG} Usuarios admin/superadmin asegurados correctamente.`
    );
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();

    if (shouldDestroyDataSource && AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}
