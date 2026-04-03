import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as bcrypt from 'bcrypt';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { rolUsuario, UserStatus } from '../modules/usuario/enums/usuario.enums';

type DefaultUserSeed = {
  username: string;
  email: string;
  nombre: string;
  rol: rolUsuario;
};

type PermissionSeed = {
  codigo: string;
  nombre: string;
  descripcion: string;
  modulo: string;
  accion: string;
};

const MIGRATION_TAG = '[MIGRACION_DEFAULT_ADMINS_20260403]';
const SOURCE_ROOT = join(process.cwd(), 'src');
const DEFAULT_TEMP_PASSWORD =
  process.env.SEED_DEFAULT_ADMIN_TEMP_PASSWORD?.trim() ||
  'SmartEconomatTemp2026!';

const DECORATOR_MARKERS = [
  'RequirePermissions',
  'RequireAnyPermission',
  'ControllerPermissions',
];

const PERMISSION_LITERAL_PATTERN = /['"`]([a-z0-9_:-]+:[a-z0-9_:-]+)['"`]/gi;

const ESSENTIAL_PERMISSION_CODES = [
  'usuarios:listar',
  'usuarios:ver',
  'usuarios:crear',
  'usuarios:editar',
  'usuarios:activar_desactivar',
  'usuarios:resetear_password',
  'productos:listar',
  'productos:ver',
  'productos:crear',
  'productos:editar',
  'proveedores:listar',
  'proveedores:crear',
  'pedidos:listar',
  'pedidos:crear',
  'recepciones:listar',
  'recepciones:crear',
  'movimientos:listar',
  'movimientos:historial',
  'inventario:listar',
  'inventario:ver',
  'dashboard:ver_estadisticas',
  'profesor:gestionar_slots',
  'profesor:gestionar_alumnos',
  'profesor:ver_alumnos',
  'alumno:cambiar_profesor',
];

const DEFAULT_USERS: readonly DefaultUserSeed[] = [
  {
    username: 'superadmin',
    email: 'superadmin@smarteconomat.com',
    nombre: 'Super Administrador',
    rol: rolUsuario.SUPER_ADMIN,
  },
  {
    username: 'admin',
    email: 'admin@smarteconomat.com',
    nombre: 'Administrador Principal',
    rol: rolUsuario.ADMIN,
  },
];

export class SeedDefaultAdminAccounts1775200000000 implements MigrationInterface {
  public name = 'SeedDefaultAdminAccounts1775200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissionCodes = this.collectPermissionCodesFromSource();
    const permissionIds = await this.ensurePermissions(
      queryRunner,
      permissionCodes
    );
    const roleIdByName = await this.ensureDefaultRoles(queryRunner);

    await this.ensureRolePermissions(queryRunner, roleIdByName, permissionIds);

    const hashedTemporaryPassword = await bcrypt.hash(
      DEFAULT_TEMP_PASSWORD,
      10
    );

    for (const seedUser of DEFAULT_USERS) {
      const roleId = roleIdByName.get(seedUser.rol);
      if (!roleId) {
        throw new Error(
          `${MIGRATION_TAG} No se encontró el rol requerido ${seedUser.rol}`
        );
      }

      const userId = await this.upsertDefaultUser(
        queryRunner,
        seedUser,
        hashedTemporaryPassword
      );

      await this.ensureUserRoleAssignments(queryRunner, userId, roleId);
    }
  }

  public down(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;
    // No-op intencional: revertir esta migración puede romper usuarios operativos.
    return Promise.resolve();
  }

  private listTypeScriptFiles(rootDir: string): string[] {
    if (!existsSync(rootDir)) {
      return [];
    }

    return readdirSync(rootDir, { withFileTypes: true }).flatMap((entry) => {
      const filePath = join(rootDir, entry.name);

      if (entry.isDirectory()) {
        if (
          entry.name === 'node_modules' ||
          entry.name === 'dist' ||
          entry.name.startsWith('.')
        ) {
          return [];
        }

        return this.listTypeScriptFiles(filePath);
      }

      return entry.isFile() && entry.name.endsWith('.ts') ? [filePath] : [];
    });
  }

  private collectPermissionCodesFromSource(): string[] {
    const permissionCodes = new Set<string>(ESSENTIAL_PERMISSION_CODES);
    const files = this.listTypeScriptFiles(SOURCE_ROOT);

    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf8');

      if (!DECORATOR_MARKERS.some((marker) => content.includes(marker))) {
        continue;
      }

      for (const match of content.matchAll(PERMISSION_LITERAL_PATTERN)) {
        const code = String(match[1] || '').trim();
        if (code.includes(':')) {
          permissionCodes.add(code);
        }
      }
    }

    return [...permissionCodes].sort();
  }

  private buildPermissionSeed(code: string): PermissionSeed | null {
    const [modulo, accion] = code.split(':');
    if (!modulo || !accion) {
      return null;
    }

    const nombre = `${modulo} ${accion}`
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase());

    return {
      codigo: code,
      nombre,
      descripcion: `${MIGRATION_TAG} Permiso bootstrap ${code}`,
      modulo,
      accion,
    };
  }

  private normalizeId(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private async ensurePermissions(
    queryRunner: QueryRunner,
    codes: string[]
  ): Promise<string[]> {
    const permissionIds = new Set<string>();

    for (const code of codes) {
      const permissionSeed = this.buildPermissionSeed(code);
      if (!permissionSeed) {
        continue;
      }

      const rows = (await queryRunner.query(
        `INSERT INTO "permiso" (
          "codigo",
          "nombre",
          "descripcion",
          "modulo",
          "accion",
          "activo"
        ) VALUES ($1, $2, $3, $4, $5, TRUE)
        ON CONFLICT ("codigo") DO UPDATE
        SET "activo" = TRUE,
            "deleted_at" = NULL,
            "deleted_by" = NULL
        RETURNING "id"`,
        [
          permissionSeed.codigo,
          permissionSeed.nombre,
          permissionSeed.descripcion,
          permissionSeed.modulo,
          permissionSeed.accion,
        ]
      )) as Array<{ id?: string }>;

      const permissionId = this.normalizeId(rows[0]?.id);
      if (!permissionId) {
        throw new Error(
          `${MIGRATION_TAG} No se pudo asegurar el permiso ${permissionSeed.codigo}`
        );
      }

      permissionIds.add(permissionId);
    }

    return [...permissionIds];
  }

  private async ensureDefaultRoles(
    queryRunner: QueryRunner
  ): Promise<Map<rolUsuario, string>> {
    const roleIdByName = new Map<rolUsuario, string>();

    for (const roleName of [rolUsuario.SUPER_ADMIN, rolUsuario.ADMIN]) {
      const roleDescription = `${MIGRATION_TAG} Rol de sistema ${roleName}`;

      const existingRows = (await queryRunner.query(
        `SELECT "id"
         FROM "rol"
         WHERE UPPER("nombre") = UPPER($1)
         ORDER BY "created_at" ASC
         LIMIT 1`,
        [roleName]
      )) as Array<{ id?: string }>;

      const existingRoleId = this.normalizeId(existingRows[0]?.id);

      if (existingRoleId) {
        await queryRunner.query(
          `UPDATE "rol"
           SET "nombre" = $1,
               "descripcion" = $2,
               "es_sistema" = TRUE,
               "activo" = TRUE,
               "deleted_at" = NULL,
               "deleted_by" = NULL,
               "updated_at" = NOW()
           WHERE "id" = $3`,
          [roleName, roleDescription, existingRoleId]
        );

        roleIdByName.set(roleName, existingRoleId);
        continue;
      }

      const insertedRows = (await queryRunner.query(
        `INSERT INTO "rol" (
          "nombre",
          "descripcion",
          "es_sistema",
          "activo"
        ) VALUES ($1, $2, TRUE, TRUE)
        RETURNING "id"`,
        [roleName, roleDescription]
      )) as Array<{ id?: string }>;

      const insertedRoleId = this.normalizeId(insertedRows[0]?.id);
      if (!insertedRoleId) {
        throw new Error(
          `${MIGRATION_TAG} No se pudo crear el rol requerido ${roleName}`
        );
      }

      roleIdByName.set(roleName, insertedRoleId);
    }

    return roleIdByName;
  }

  private async ensureRolePermissions(
    queryRunner: QueryRunner,
    roleIdByName: Map<rolUsuario, string>,
    permissionIds: string[]
  ): Promise<void> {
    for (const roleName of [rolUsuario.SUPER_ADMIN, rolUsuario.ADMIN]) {
      const roleId = roleIdByName.get(roleName);
      if (!roleId) {
        throw new Error(
          `${MIGRATION_TAG} No se pudo resolver el rol ${roleName}`
        );
      }

      for (const permissionId of permissionIds) {
        await queryRunner.query(
          `INSERT INTO "rol_permiso" (
            "rol_id",
            "permiso_id"
          ) VALUES ($1, $2)
          ON CONFLICT ("rol_id", "permiso_id") DO NOTHING`,
          [roleId, permissionId]
        );
      }
    }
  }

  private async upsertDefaultUser(
    queryRunner: QueryRunner,
    seedUser: DefaultUserSeed,
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

    const existingUserId = this.normalizeId(existingRows[0]?.id);

    if (existingUserId) {
      await queryRunner.query(
        `UPDATE "usuario"
         SET "nombre" = $1,
             "username" = $2,
             "email" = $3,
             "password" = $4,
             "rol" = $5,
             "status" = $6,
             "activo" = TRUE,
             "must_change_password" = TRUE,
             "resetPasswordOtp" = NULL,
             "resetPasswordOtpExpires" = NULL,
             "deleted_at" = NULL,
             "deleted_by" = NULL,
             "updated_at" = NOW()
         WHERE "id" = $7`,
        [
          seedUser.nombre,
          seedUser.username,
          seedUser.email,
          hashedTemporaryPassword,
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

    const insertedUserId = this.normalizeId(insertedRows[0]?.id);
    if (!insertedUserId) {
      throw new Error(
        `${MIGRATION_TAG} No se pudo crear el usuario ${seedUser.username}`
      );
    }

    return insertedUserId;
  }

  private async ensureUserRoleAssignments(
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
}
