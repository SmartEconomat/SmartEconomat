import { MigrationInterface, QueryRunner } from 'typeorm';
import { ALL_PERMISSION_CODES } from '../common/constants/permissions.constants';
import {
  ADMIN_PERMISSION_CODES,
  ADMIN_RESTRICTED_PERMISSION_CODES,
} from '../common/constants/role-permission-sets.constants';
import { getSystemRoleTemplateAliases } from '../common/constants/system-role-template.constants';
import { rolUsuario } from '../modules/usuario/enums/usuario.enums';

type PermissionSeed = {
  codigo: string;
  nombre: string;
  descripcion: string;
  modulo: string;
  accion: string;
};

type RoleTemplateSeed = {
  role: rolUsuario;
  descripcion: string;
  esEditable: boolean;
};

const MIGRATION_TAG = '[MIGRACION_SHERLOCK_AUTH]';

const PROFESOR_PERMISSION_CODES = [
  'profesor:gestionar_slots',
  'profesor:ver_alumnos',
  'profesor:gestionar_alumnos',
  'dashboard:ver_estadisticas',
  'productos:listar',
  'productos:ver',
  'proveedores:listar',
  'ubicaciones:listar',
  'ubicaciones:ver',
  'inventario:listar',
  'inventario:ver',
  'inventario:ajustar_stock',
  'pedidos:crear',
  'pedidos:listar',
  'pedidos:ver',
  'pedidos:editar',
  'pedidos:cancelar',
  'recepciones:listar',
  'recepciones:ver',
  'recepciones:editar',
  'incidencias:crear',
  'incidencias:listar',
  'incidencias:ver',
  'incidencias:editar',
  'incidencias:resolver',
  'albaranes:crear',
  'albaranes:listar',
  'albaranes:ver',
  'albaranes:editar',
  'recetas:listar',
  'recetas:ver',
  'recetas:cocinar',
  'merma:crear',
  'merma:listar',
  'merma:ver',
  'merma:stats',
  'archivos:subir',
  'archivos:listar',
  'archivos:ver',
] as const;

const ALUMNO_PERMISSION_CODES = [
  'alumno:cambiar_profesor',
  'dashboard:ver_estadisticas',
  'productos:listar',
  'productos:ver',
  'proveedores:listar',
  'inventario:listar',
  'inventario:ver',
  'recetas:listar',
  'recetas:ver',
  'merma:listar',
  'merma:ver',
] as const;

const ROLE_TEMPLATE_SEEDS: readonly RoleTemplateSeed[] = [
  {
    role: rolUsuario.SUPER_ADMIN,
    descripcion: `${MIGRATION_TAG} Plantilla base de sistema SUPER_ADMIN`,
    esEditable: false,
  },
  {
    role: rolUsuario.ADMIN,
    descripcion: `${MIGRATION_TAG} Plantilla base de sistema ADMIN`,
    esEditable: false,
  },
  {
    role: rolUsuario.PROFESOR,
    descripcion: `${MIGRATION_TAG} Plantilla base operativa PROFESOR`,
    esEditable: true,
  },
  {
    role: rolUsuario.ALUMNO,
    descripcion: `${MIGRATION_TAG} Plantilla base operativa ALUMNO`,
    esEditable: true,
  },
];

export class SherlockAuthMigration1775050000000 implements MigrationInterface {
  public name = 'sherlockAuthMigration1775050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rol" ADD COLUMN IF NOT EXISTS "plantilla_rol_id" uuid`
    );

    const permissionCodes = [...ALL_PERMISSION_CODES].sort();
    const permissionIdByCode = await this.ensurePermissions(
      queryRunner,
      permissionCodes
    );

    await this.deactivateGhostPermissions(queryRunner, permissionCodes);

    const roleIdByName = await this.ensureSystemRoles(queryRunner);
    const templateIdByRole = await this.ensureRoleTemplates(queryRunner);

    const rolePermissionCodes =
      this.resolveRolePermissionCodes(permissionCodes);

    await this.enforceAdminRestrictions(
      queryRunner,
      roleIdByName,
      templateIdByRole
    );

    await this.ensureRolePermissions(
      queryRunner,
      roleIdByName,
      permissionIdByCode,
      rolePermissionCodes
    );

    await this.ensureTemplatePermissions(
      queryRunner,
      templateIdByRole,
      permissionIdByCode,
      rolePermissionCodes
    );
  }

  public down(): Promise<void> {
    return Promise.resolve();
  }

  private normalizeId(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
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
        SET "nombre" = EXCLUDED."nombre",
            "descripcion" = EXCLUDED."descripcion",
            "modulo" = EXCLUDED."modulo",
            "accion" = EXCLUDED."accion",
            "activo" = TRUE,
            "deleted_at" = NULL,
            "deleted_by" = NULL,
            "updated_at" = NOW()
        RETURNING "id", "codigo"`,
        [
          permissionSeed.codigo,
          permissionSeed.nombre,
          permissionSeed.descripcion,
          permissionSeed.modulo,
          permissionSeed.accion,
        ]
      )) as Array<{ id?: string; codigo?: string }>;

      const permissionId = this.normalizeId(rows[0]?.id);
      const permissionCode = String(rows[0]?.codigo ?? permissionSeed.codigo);

      if (!permissionId) {
        throw new Error(
          `${MIGRATION_TAG} No se pudo asegurar el permiso ${permissionSeed.codigo}`
        );
      }

      permissionIdByCode.set(permissionCode, permissionId);
    }

    return permissionIdByCode;
  }

  /**
   * Documentación en español.
   */
  private async deactivateGhostPermissions(
    queryRunner: QueryRunner,
    activeCodes: string[]
  ): Promise<void> {
    await queryRunner.query(
      `UPDATE "permiso" SET "activo" = FALSE
       WHERE "codigo" = 'movimientos:historial'
         AND "codigo" NOT IN (${activeCodes.map((_, i) => `$${i + 1}`).join(', ')})`,
      activeCodes
    );
  }

  private async ensureSystemRoles(
    queryRunner: QueryRunner
  ): Promise<Map<rolUsuario, string>> {
    const roleIdByName = new Map<rolUsuario, string>();

    for (const roleName of [
      rolUsuario.SUPER_ADMIN,
      rolUsuario.ADMIN,
      rolUsuario.PROFESOR,
      rolUsuario.ALUMNO,
    ]) {
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

  private async ensureRoleTemplates(
    queryRunner: QueryRunner
  ): Promise<Map<rolUsuario, string>> {
    const templateIdByRole = new Map<rolUsuario, string>();

    for (const seed of ROLE_TEMPLATE_SEEDS) {
      const aliases = getSystemRoleTemplateAliases(seed.role).map((name) =>
        name.trim().toUpperCase()
      );

      const existingRows = (await queryRunner.query(
        `SELECT "id"
         FROM "plantilla_rol"
         WHERE UPPER("nombre") = ANY($1::text[])
         ORDER BY CASE
                    WHEN UPPER("nombre") = UPPER($2) THEN 0
                    ELSE 1
                  END ASC,
                  "created_at" ASC`,
        [aliases, seed.role]
      )) as Array<{ id?: string }>;

      const existingTemplateId = this.normalizeId(existingRows[0]?.id);

      const duplicateTemplateIds = existingRows
        .slice(1)
        .map((row) => this.normalizeId(row.id))
        .filter((templateId): templateId is string => templateId !== null);

      if (existingTemplateId && duplicateTemplateIds.length > 0) {
        await this.collapseTemplateDuplicates(
          queryRunner,
          existingTemplateId,
          duplicateTemplateIds
        );
      }

      if (existingTemplateId) {
        await queryRunner.query(
          `UPDATE "plantilla_rol"
           SET "nombre" = $1,
               "descripcion" = $2,
               "es_editable" = $3,
               "activo" = TRUE,
               "plantilla_padre_id" = NULL,
               "deleted_at" = NULL,
               "deleted_by" = NULL,
               "updated_at" = NOW()
           WHERE "id" = $4`,
          [seed.role, seed.descripcion, seed.esEditable, existingTemplateId]
        );

        templateIdByRole.set(seed.role, existingTemplateId);
        continue;
      }

      const insertedRows = (await queryRunner.query(
        `INSERT INTO "plantilla_rol" (
          "nombre",
          "descripcion",
          "es_editable",
          "activo",
          "plantilla_padre_id"
        ) VALUES ($1, $2, $3, TRUE, NULL)
        RETURNING "id"`,
        [seed.role, seed.descripcion, seed.esEditable]
      )) as Array<{ id?: string }>;

      const insertedTemplateId = this.normalizeId(insertedRows[0]?.id);
      if (!insertedTemplateId) {
        throw new Error(
          `${MIGRATION_TAG} No se pudo crear la plantilla ${seed.role}`
        );
      }

      templateIdByRole.set(seed.role, insertedTemplateId);
    }

    return templateIdByRole;
  }

  private async collapseTemplateDuplicates(
    queryRunner: QueryRunner,
    keepTemplateId: string,
    duplicateTemplateIds: string[]
  ): Promise<void> {
    const uniqueDuplicateIds = [...new Set(duplicateTemplateIds)].filter(
      (templateId) => templateId !== keepTemplateId
    );

    if (uniqueDuplicateIds.length === 0) {
      return;
    }

    await queryRunner.query(
      `UPDATE "rol"
       SET "plantilla_rol_id" = $1
       WHERE "plantilla_rol_id" = ANY($2::uuid[])`,
      [keepTemplateId, uniqueDuplicateIds]
    );

    await queryRunner.query(
      `UPDATE "plantilla_rol"
       SET "plantilla_padre_id" = $1
       WHERE "plantilla_padre_id" = ANY($2::uuid[])`,
      [keepTemplateId, uniqueDuplicateIds]
    );

    await queryRunner.query(
      `DELETE FROM "plantilla_rol"
       WHERE "id" = ANY($1::uuid[])`,
      [uniqueDuplicateIds]
    );
  }

  private resolveRolePermissionCodes(
    allPermissionCodes: string[]
  ): Map<rolUsuario, string[]> {
    const all = [...new Set(allPermissionCodes)].sort();

    return new Map<rolUsuario, string[]>([
      [rolUsuario.SUPER_ADMIN, all],
      [rolUsuario.ADMIN, [...ADMIN_PERMISSION_CODES].sort()],
      [rolUsuario.PROFESOR, [...new Set(PROFESOR_PERMISSION_CODES)].sort()],
      [rolUsuario.ALUMNO, [...new Set(ALUMNO_PERMISSION_CODES)].sort()],
    ]);
  }

  /**
   * Documentación en español.
   */
  private async enforceAdminRestrictions(
    queryRunner: QueryRunner,
    roleIdByName: Map<rolUsuario, string>,
    templateIdByRole: Map<rolUsuario, string>
  ): Promise<void> {
    const restrictedCodes = [...ADMIN_RESTRICTED_PERMISSION_CODES];

    const adminRoleId = roleIdByName.get(rolUsuario.ADMIN);
    if (adminRoleId) {
      await queryRunner.query(
        `DELETE FROM "rol_permiso"
         WHERE "rol_id" = $1
           AND "permiso_id" IN (
             SELECT "id" FROM "permiso"
             WHERE "codigo" = ANY($2)
           )`,
        [adminRoleId, restrictedCodes]
      );
    }

    const adminTemplateId = templateIdByRole.get(rolUsuario.ADMIN);
    if (adminTemplateId) {
      await queryRunner.query(
        `DELETE FROM "plantilla_rol_permiso"
         WHERE "plantilla_rol_id" = $1
           AND "permiso_id" IN (
             SELECT "id" FROM "permiso"
             WHERE "codigo" = ANY($2)
           )`,
        [adminTemplateId, restrictedCodes]
      );
    }

    await queryRunner.query(
      `DELETE FROM "usuario_permiso_adicional"
       WHERE "usuario_id" IN (
         SELECT "id" FROM "usuario"
         WHERE UPPER("rol"::text) = UPPER($1)
       )
         AND "permiso_id" IN (
           SELECT "id" FROM "permiso"
           WHERE "codigo" = ANY($2)
         )`,
      [rolUsuario.ADMIN, restrictedCodes]
    );
  }

  private async ensureRolePermissions(
    queryRunner: QueryRunner,
    roleIdByName: Map<rolUsuario, string>,
    permissionIdByCode: Map<string, string>,
    rolePermissionCodes: Map<rolUsuario, string[]>
  ): Promise<void> {
    for (const [roleName, permissionCodes] of rolePermissionCodes.entries()) {
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
            `${MIGRATION_TAG} No se encontró el permiso ${code} para el rol ${roleName}`
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

  private async ensureTemplatePermissions(
    queryRunner: QueryRunner,
    templateIdByRole: Map<rolUsuario, string>,
    permissionIdByCode: Map<string, string>,
    rolePermissionCodes: Map<rolUsuario, string[]>
  ): Promise<void> {
    for (const [roleName, permissionCodes] of rolePermissionCodes.entries()) {
      const templateId = templateIdByRole.get(roleName);
      if (!templateId) {
        throw new Error(
          `${MIGRATION_TAG} No se pudo resolver la plantilla ${roleName}`
        );
      }

      for (const code of permissionCodes) {
        const permissionId = permissionIdByCode.get(code);
        if (!permissionId) {
          throw new Error(
            `${MIGRATION_TAG} No se encontró el permiso ${code} para la plantilla ${roleName}`
          );
        }

        await queryRunner.query(
          `INSERT INTO "plantilla_rol_permiso" (
            "plantilla_rol_id",
            "permiso_id"
          ) VALUES ($1, $2)
          ON CONFLICT ("plantilla_rol_id", "permiso_id") DO NOTHING`,
          [templateId, permissionId]
        );
      }
    }
  }
}
