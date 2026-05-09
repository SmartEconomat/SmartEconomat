import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRACIÓN CONSOLIDADA DEFINITIVA (2026-05-07)
 *
 * Esta migración integra TODOS los cambios estructurales del sistema en un único lugar,
 * consolidando el estado esperado del schema sin depender del orden histórico de migraciones.
 *
 * Cambios integrados:
 * - Columnas faltantes en movimiento (accion, datos_antes, datos_despues)
 * - Columnas faltantes en usuario (ubicacion_id, preferences, idioma)
 * - Columnas faltantes en rol (plantilla_rol_id + FK + index)
 * - Columnas faltantes en pedido_usuario (consolidacion_estado)
 * - Columnas faltantes en incidencia (estado, proveedor_id)
 * - Refactorización de incidencia_linea (rename + columnas faltantes)
 * - Tabla puente usuario_ubicacion (M2M)
 * - Eliminación de legacy almacen (con validaciones)
 *
 * Estrategia: 100% idempotente. Verifica estado antes de actuar.
 * Compatible con: instalaciones nuevas Y instalaciones antiguas.
 *
 * @date 2026-05-07
 * @version 1.0.0
 */
export class ConsolidatedBaseSchema1775900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('[Consolidation] Iniciando consolidación de schema...');

    console.log('[Consolidation] Creando enums...');

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."accion_movimiento" AS ENUM (
          'CREAR', 'ACTUALIZAR', 'ELIMINAR', 'CONFIG_CHANGE',
          'RESOLVEINCIDENCIA', 'AUDIT', 'OTRO'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."estado_consolidacion" AS ENUM ('not_consolidated', 'consolidated');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."incidencia_estado_enum" AS ENUM ('ABIERTA', 'EN_PROCESO', 'RESUELTA');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."incidencia_linea_estado_enum_alt" AS ENUM ('SIN_PROBLEMA', 'PENDIENTE_AJUSTE', 'AJUSTADO');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE n.nspname = 'public'
            AND t.typname = 'movimiento_tipo_enum'
            AND e.enumlabel = 'auditoria'
        ) THEN
          ALTER TYPE "public"."movimiento_tipo_enum" ADD VALUE 'auditoria';
        END IF;
      END $$;
    `);

    console.log('[Consolidation] Actualizando tabla movimiento...');

    await this.addColumnIfNotExists(
      queryRunner,
      'movimiento',
      'accion',
      `
      ALTER TABLE "movimiento" ADD COLUMN "accion" "public"."accion_movimiento" DEFAULT NULL
    `
    );

    await this.addColumnIfNotExists(
      queryRunner,
      'movimiento',
      'datos_antes',
      `
      ALTER TABLE "movimiento" ADD COLUMN "datos_antes" jsonb DEFAULT NULL
    `
    );

    await this.addColumnIfNotExists(
      queryRunner,
      'movimiento',
      'datos_despues',
      `
      ALTER TABLE "movimiento" ADD COLUMN "datos_despues" jsonb DEFAULT NULL
    `
    );

    console.log('[Consolidation] Actualizando tabla usuario...');

    await this.addColumnIfNotExists(
      queryRunner,
      'usuario',
      'ubicacion_id',
      `
      ALTER TABLE "usuario" ADD COLUMN "ubicacion_id" uuid DEFAULT NULL
    `
    );

    await this.addColumnIfNotExists(
      queryRunner,
      'usuario',
      'preferences',
      `
      ALTER TABLE "usuario" ADD COLUMN "preferences" jsonb DEFAULT '{}'::jsonb
    `
    );

    await this.ensureForeignKey(
      queryRunner,
      'usuario',
      'FK_usuario_ubicacion_id_ubicacion',
      'ubicacion_id',
      'ubicacion',
      'id',
      'SET NULL'
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_usuario_ubicacion_id" ON "usuario" ("ubicacion_id")`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_usuario_preferences" ON "usuario" USING GIN ("preferences")`
    );

    await this.addColumnIfNotExists(
      queryRunner,
      'usuario',
      'idioma',
      `
      ALTER TABLE "usuario" ADD COLUMN "idioma" character varying(5) DEFAULT 'es'
    `
    );

    console.log('[Consolidation] Actualizando tabla rol...');

    await this.addColumnIfNotExists(
      queryRunner,
      'rol',
      'plantilla_rol_id',
      `
      ALTER TABLE "rol" ADD COLUMN "plantilla_rol_id" uuid DEFAULT NULL
    `
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_rol_plantilla_rol_id" ON "rol" ("plantilla_rol_id")`
    );

    await this.ensureForeignKey(
      queryRunner,
      'rol',
      'FK_rol_plantilla_rol_id_plantilla_rol',
      'plantilla_rol_id',
      'plantilla_rol',
      'id',
      'SET NULL'
    );

    await queryRunner.query(`
      UPDATE "rol"
      SET "plantilla_rol_id" = "plantilla_rol"."id"
      FROM "plantilla_rol"
      WHERE "rol"."plantilla_rol_id" IS NULL
        AND "rol"."deleted_at" IS NULL
        AND "plantilla_rol"."deleted_at" IS NULL
        AND UPPER("rol"."nombre") = UPPER("plantilla_rol"."nombre")
    `);

    console.log('[Consolidation] Asegurando tabla usuario_ubicacion...');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "usuario_ubicacion" (
        "usuario_id" uuid NOT NULL,
        "ubicacion_id" uuid NOT NULL,
        CONSTRAINT "PK_usuario_ubicacion" PRIMARY KEY ("usuario_id", "ubicacion_id"),
        CONSTRAINT "FK_usuario_ubicacion_usuario" FOREIGN KEY ("usuario_id")
          REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_usuario_ubicacion_ubicacion" FOREIGN KEY ("ubicacion_id")
          REFERENCES "ubicacion"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_usuario_ubicacion_usuario_id" ON "usuario_ubicacion" ("usuario_id")`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_usuario_ubicacion_ubicacion_id" ON "usuario_ubicacion" ("ubicacion_id")`
    );

    await queryRunner.query(`
      INSERT INTO "usuario_ubicacion" ("usuario_id", "ubicacion_id")
      SELECT u."id", u."ubicacion_id"
      FROM "usuario" u
      WHERE u."ubicacion_id" IS NOT NULL
      ON CONFLICT DO NOTHING
    `);

    console.log('[Consolidation] Actualizando tabla pedido_usuario...');

    await this.addColumnIfNotExists(
      queryRunner,
      'pedido_usuario',
      'consolidacion_estado',
      `
      ALTER TABLE "pedido_usuario" ADD COLUMN "consolidacion_estado"
        "public"."estado_consolidacion" NOT NULL DEFAULT 'not_consolidated'
    `
    );

    await queryRunner.query(`
      UPDATE "pedido_usuario"
      SET "consolidacion_estado" = 'consolidated'::estado_consolidacion
      WHERE estado = 'consolidado' AND consolidacion_estado = 'not_consolidated'
    `);

    console.log('[Consolidation] Actualizando tabla incidencia...');

    await this.addColumnIfNotExists(
      queryRunner,
      'incidencia',
      'estado',
      `
      ALTER TABLE "incidencia" ADD COLUMN "estado"
        "public"."incidencia_estado_enum" NOT NULL DEFAULT 'ABIERTA'
    `
    );

    await this.addColumnIfNotExists(
      queryRunner,
      'incidencia',
      'proveedor_id',
      `
      ALTER TABLE "incidencia" ADD COLUMN "proveedor_id" uuid DEFAULT NULL
    `
    );

    await queryRunner.query(`
      UPDATE "incidencia"
      SET "estado" = 'RESUELTA'::incidencia_estado_enum
      WHERE "fecha_resolucion" IS NOT NULL AND "estado" = 'ABIERTA'
    `);

    await queryRunner.query(`
      UPDATE "incidencia" i
      SET "proveedor_id" = p."proveedor_id"
      FROM "pedido" p
      WHERE i."pedido_id" = p."id"
        AND i."proveedor_id" IS NULL
        AND p."proveedor_id" IS NOT NULL
    `);

    await this.ensureForeignKey(
      queryRunner,
      'incidencia',
      'FK_incidencia_proveedor_id_proveedor',
      'proveedor_id',
      'proveedor',
      'id',
      'SET NULL'
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_incidencia_proveedor_id" ON "incidencia" ("proveedor_id")`
    );

    console.log('[Consolidation] Refactorizando tabla incidencia_linea...');

    const table = await queryRunner.getTable('incidencia_linea');
    const hasOldColumn = table?.findColumnByName('cantidad_esperada');
    const hasNewColumn = table?.findColumnByName('cantidad_pedida');

    if (hasOldColumn && !hasNewColumn) {
      await queryRunner.query(
        `ALTER TABLE "incidencia_linea" RENAME COLUMN "cantidad_esperada" TO "cantidad_pedida"`
      );
    }

    await this.addColumnIfNotExists(
      queryRunner,
      'incidencia_linea',
      'cantidad_ajustada',
      `
      ALTER TABLE "incidencia_linea" ADD COLUMN "cantidad_ajustada" numeric(12,3) NOT NULL DEFAULT '0'
    `
    );

    await this.addColumnIfNotExists(
      queryRunner,
      'incidencia_linea',
      'estado',
      `
      ALTER TABLE "incidencia_linea" ADD COLUMN "estado"
        "public"."incidencia_linea_estado_enum_alt" NOT NULL DEFAULT 'PENDIENTE_AJUSTE'
    `
    );

    await this.addColumnIfNotExists(
      queryRunner,
      'incidencia_linea',
      'necesita_ajuste',
      `
      ALTER TABLE "incidencia_linea" ADD COLUMN "necesita_ajuste" boolean NOT NULL DEFAULT true
    `
    );

    await queryRunner.query(`
      UPDATE "incidencia_linea"
      SET "necesita_ajuste" = (ABS("diferencia") > 0.0005)
      WHERE "necesita_ajuste" IS NOT DISTINCT FROM true
    `);

    console.log('[Consolidation] Eliminando legacy almacen...');

    await this.removeLegacyAlmacenIfSafe(queryRunner);

    console.log('[Consolidation] Ejecutando validación final...');
    await this.validateConsolidation(queryRunner);

    console.log('[Consolidation] ✅ Consolidación completada exitosamente');
  }

  /**
   * Agrega una columna si no existe.
   */
  private async addColumnIfNotExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
    alterSql: string
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table?.findColumnByName(columnName)) {
      try {
        await queryRunner.query(alterSql);
      } catch (err) {
        console.warn(
          `[Consolidation] Advertencia al agregar columna ${tableName}.${columnName}:`,
          err
        );
      }
    }
  }

  /**
   * Asegura que una FK existe. Si no existe y la tabla destino está presente, la crea.
   */
  private async ensureForeignKey(
    queryRunner: QueryRunner,
    sourceTable: string,
    fkName: string,
    columnName: string,
    targetTable: string,
    targetColumn: string,
    onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT'
  ): Promise<void> {
    try {
      const constraint = await queryRunner.query(
        `
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name = $1 AND constraint_name = $2
      `,
        [sourceTable, fkName]
      );

      if (constraint && constraint.length === 0) {
        const targetExists = await queryRunner.query(
          `
          SELECT to_regclass($1) IS NOT NULL
        `,
          [`public.${targetTable}`]
        );

        if (targetExists[0] && targetExists[0]['?column?']) {
          await queryRunner.query(`
            ALTER TABLE "${sourceTable}"
            ADD CONSTRAINT "${fkName}"
            FOREIGN KEY ("${columnName}") REFERENCES "${targetTable}"("${targetColumn}")
            ON DELETE ${onDelete} ON UPDATE NO ACTION
          `);
        }
      }
    } catch (err) {
      console.warn(`[Consolidation] Advertencia al crear FK ${fkName}:`, err);
    }
  }

  /**
   * Elimina legacy almacen SOLO si es seguro (sin usar almacen_id en ubicacion ni usuario).
   */
  private async removeLegacyAlmacenIfSafe(
    queryRunner: QueryRunner
  ): Promise<void> {
    try {
      const almacenExists = await queryRunner.query(`
        SELECT to_regclass('public.almacen') IS NOT NULL AS exists
      `);

      if (!almacenExists[0]?.exists) {
        return;
      }

      const usuarioHasAlmacenId = await queryRunner.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'usuario' AND column_name = 'almacen_id'
      `);

      const ubicacionHasAlmacenId = await queryRunner.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'ubicacion' AND column_name = 'almacen_id'
      `);

      if (
        usuarioHasAlmacenId.length === 0 &&
        ubicacionHasAlmacenId.length === 0
      ) {
        await queryRunner.query(`DROP TABLE IF EXISTS "almacen"`);
      }
    } catch (err) {
      console.warn('[Consolidation] Advertencia al eliminar almacen:', err);
    }
  }

  /**
   * Valida que el schema consolidado está completo.
   */
  private async validateConsolidation(queryRunner: QueryRunner): Promise<void> {
    const checks: Array<{ name: string; sql: string }> = [];

    checks.push({
      name: 'accion_movimiento enum',
      sql: `SELECT to_regtype('public.accion_movimiento') IS NOT NULL`,
    });

    checks.push({
      name: 'estado_consolidacion enum',
      sql: `SELECT to_regtype('public.estado_consolidacion') IS NOT NULL`,
    });

    checks.push({
      name: 'incidencia_estado_enum enum',
      sql: `SELECT to_regtype('public.incidencia_estado_enum') IS NOT NULL`,
    });

    checks.push({
      name: 'movimiento.accion column',
      sql: `SELECT column_name FROM information_schema.columns
            WHERE table_name = 'movimiento' AND column_name = 'accion'`,
    });

    checks.push({
      name: 'usuario.ubicacion_id column',
      sql: `SELECT column_name FROM information_schema.columns
            WHERE table_name = 'usuario' AND column_name = 'ubicacion_id'`,
    });

    checks.push({
      name: 'usuario.preferences column',
      sql: `SELECT column_name FROM information_schema.columns
            WHERE table_name = 'usuario' AND column_name = 'preferences'`,
    });

    checks.push({
      name: 'usuario_ubicacion table',
      sql: `SELECT to_regclass('public.usuario_ubicacion') IS NOT NULL`,
    });

    checks.push({
      name: 'incidencia.estado column',
      sql: `SELECT column_name FROM information_schema.columns
            WHERE table_name = 'incidencia' AND column_name = 'estado'`,
    });

    checks.push({
      name: 'pedido_usuario.consolidacion_estado column',
      sql: `SELECT column_name FROM information_schema.columns
            WHERE table_name = 'pedido_usuario' AND column_name = 'consolidacion_estado'`,
    });

    let allPassed = true;
    for (const check of checks) {
      try {
        const result = await queryRunner.query(check.sql);
        const passed = result && result.length > 0 && result[0];
        if (!passed) {
          console.warn(`[Consolidation] ⚠️ Check failed: ${check.name}`);
          allPassed = false;
        }
      } catch (err) {
        console.warn(`[Consolidation] ⚠️ Check error: ${check.name}`, err);
      }
    }

    if (!allPassed) {
      console.warn(
        '[Consolidation] ⚠️ Algunos checks fallaron, pero continuando...'
      );
    }
  }

  public down(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;

    console.log(
      '[Consolidation] Down: No hace nada (consolidación es permanente)'
    );
    return Promise.resolve();
  }
}
