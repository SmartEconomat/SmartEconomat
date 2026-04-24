import { MigrationInterface, QueryRunner } from 'typeorm';
import { ALL_PERMISSION_CODES } from '../common/constants/permissions.constants';
import { ADMIN_PERMISSION_CODES } from '../common/constants/role-permission-sets.constants';
import { rolUsuario } from '../modules/usuario/enums/usuario.enums';

type PermissionSeed = {
  codigo: string;
  nombre: string;
  descripcion: string;
  modulo: string;
  accion: string;
};

const MIGRATION_TAG = '[MIGRACION_DEFAULT_ADMINS_20260403]';

export class SeedDefaultAdminAccounts1775200000000 implements MigrationInterface {
  public name = 'SeedDefaultAdminAccounts1775200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissionCodes = [...ALL_PERMISSION_CODES].sort();
    const permissionIdByCode = await this.ensurePermissions(
      queryRunner,
      permissionCodes
    );
    const roleIdByName = await this.ensureDefaultRoles(queryRunner);

    await this.ensureRolePermissions(
      queryRunner,
      roleIdByName,
      permissionIdByCode
    );
  }

  public down(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;

    return Promise.resolve();
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
  ): Promise<Map<string, string>> {
    const permissionIdByCode = new Map<string, string>();

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

      permissionIdByCode.set(permissionSeed.codigo, permissionId);
    }

    return permissionIdByCode;
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
    permissionIdByCode: Map<string, string>
  ): Promise<void> {
    const rolePermissions = new Map<rolUsuario, readonly string[]>([
      [rolUsuario.SUPER_ADMIN, [...ALL_PERMISSION_CODES].sort()],
      [rolUsuario.ADMIN, [...ADMIN_PERMISSION_CODES].sort()],
    ]);

    for (const [roleName, permissionCodes] of rolePermissions.entries()) {
      const roleId = roleIdByName.get(roleName);
      if (!roleId) {
        throw new Error(
          `${MIGRATION_TAG} No se pudo resolver el rol ${roleName}`
        );
      }

      for (const code of permissionCodes) {
        const permissionId = permissionIdByCode.get(code);
        if (!permissionId) {
          throw new Error(
            `${MIGRATION_TAG} No se pudo resolver el permiso ${code} para ${roleName}`
          );
        }

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
}
