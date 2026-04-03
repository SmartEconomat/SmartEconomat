import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MigrationInterface, QueryRunner } from 'typeorm';
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

const MIGRATION_TAG = '[MIGRACION_SHERLOCK_AUTH_20260403]';
const SOURCE_ROOT = join(process.cwd(), 'src');

const DECORATOR_MARKERS = [
  'RequirePermissions',
  'RequireAnyPermission',
  'ControllerPermissions',
  'Permissions(',
  'PermissionsAny(',
  'PermissionsAll(',
];

const PERMISSION_LITERAL_PATTERN = /['"`]([a-z0-9_:-]+:[a-z0-9_:-]+)['"`]/gi;

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
  ...PROFESOR_PERMISSION_CODES,
  ...ALUMNO_PERMISSION_CODES,
];

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
    const permissionCodes = this.collectPermissionCodesFromSource();
    const permissionIdByCode = await this.ensurePermissions(
      queryRunner,
      permissionCodes
    );

    const roleIdByName = await this.ensureSystemRoles(queryRunner);
    const templateIdByRole = await this.ensureRoleTemplates(queryRunner);

    const rolePermissionCodes =
      this.resolveRolePermissionCodes(permissionCodes);

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

  public down(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;
    // No-op intencional: este bootstrap es fundacional para el control de acceso.
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
      const existingRows = (await queryRunner.query(
        `SELECT "id"
         FROM "plantilla_rol"
         WHERE UPPER("nombre") = UPPER($1)
         ORDER BY "created_at" ASC
         LIMIT 1`,
        [seed.role]
      )) as Array<{ id?: string }>;

      const existingTemplateId = this.normalizeId(existingRows[0]?.id);

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

  private resolveRolePermissionCodes(
    allPermissionCodes: string[]
  ): Map<rolUsuario, string[]> {
    const all = [...new Set(allPermissionCodes)].sort();

    return new Map<rolUsuario, string[]>([
      [rolUsuario.SUPER_ADMIN, all],
      [rolUsuario.ADMIN, all],
      [rolUsuario.PROFESOR, [...new Set(PROFESOR_PERMISSION_CODES)].sort()],
      [rolUsuario.ALUMNO, [...new Set(ALUMNO_PERMISSION_CODES)].sort()],
    ]);
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
