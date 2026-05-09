import { MigrationInterface, QueryRunner } from 'typeorm';

const TAG = '[MIG_PERMISO_TRANSFERIR_INV]';

/**
 * Inserta `inventario:transferir` y lo asocia a plantillas/roles elevados ya existentes.
 */
export class SeedInventarioTransferirPermission1776310000000 implements MigrationInterface {
  name = 'SeedInventarioTransferirPermission1776310000000';

  /**
   * Migra datos hacia adelante.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "permiso" (
        "codigo",
        "nombre",
        "descripcion",
        "modulo",
        "accion",
        "activo"
      ) VALUES (
        'inventario:transferir',
        'Inventario Transferir',
        $1,
        'inventario',
        'transferir',
        TRUE
      )
      ON CONFLICT ("codigo") DO UPDATE SET
        "nombre" = EXCLUDED."nombre",
        "descripcion" = EXCLUDED."descripcion",
        "modulo" = EXCLUDED."modulo",
        "accion" = EXCLUDED."accion",
        "activo" = TRUE,
        "deleted_at" = NULL,
        "deleted_by" = NULL,
        "updated_at" = NOW()`,
      [`${TAG} Transferir stock entre ubicaciones con trazabilidad`]
    );

    await queryRunner.query(`
      INSERT INTO "rol_permiso" ("rol_id", "permiso_id")
      SELECT r."id", p."id"
      FROM "rol" r
      CROSS JOIN "permiso" p
      WHERE UPPER(r."nombre") IN ('SUPER_ADMIN', 'ADMIN', 'PROFESOR')
        AND p."codigo" = 'inventario:transferir'
      ON CONFLICT ("rol_id", "permiso_id") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "plantilla_rol_permiso" ("plantilla_rol_id", "permiso_id")
      SELECT pr."id", p."id"
      FROM "plantilla_rol" pr
      CROSS JOIN "permiso" p
      WHERE UPPER(pr."nombre") IN ('SUPER_ADMIN', 'ADMIN', 'PROFESOR')
        AND p."codigo" = 'inventario:transferir'
      ON CONFLICT ("plantilla_rol_id", "permiso_id") DO NOTHING
    `);
  }

  /**
   * Revierte la migración (no elimina permisos manualmente definidos si existen otros enlaces).
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    const rows = (await queryRunner.query(
      `SELECT "id" FROM "permiso" WHERE "codigo" = 'inventario:transferir' LIMIT 1`
    )) as Array<{ id?: string }>;
    const permisoId = rows[0]?.id;
    if (!permisoId) {
      return;
    }

    await queryRunner.query(
      `DELETE FROM "plantilla_rol_permiso" WHERE "permiso_id" = $1`,
      [permisoId]
    );
    await queryRunner.query(
      `DELETE FROM "rol_permiso" WHERE "permiso_id" = $1`,
      [permisoId]
    );
    await queryRunner.query(`DELETE FROM "permiso" WHERE "id" = $1`, [
      permisoId,
    ]);
  }
}
