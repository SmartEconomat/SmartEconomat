import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Evolución WMS: pivots usuario–ubicación con ACL, clase–ubicación,
 * ubicación jerárquica/metadata, transferencias formales,
 * columnas densas en movimiento para reporting.
 */
export class WmsUbicacionesPivotsTransferencias1776300000000 implements MigrationInterface {
  name = 'WmsUbicacionesPivotsTransferencias1776300000000';

  /**
   * Ejecuta la migración.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ubicacion"
      ADD COLUMN IF NOT EXISTS "parent_id" uuid,
      ADD COLUMN IF NOT EXISTS "organizacion_id" uuid,
      ADD COLUMN IF NOT EXISTS "codigo" character varying(64),
      ADD COLUMN IF NOT EXISTS "tipo" character varying(40) NOT NULL DEFAULT 'almacen_general',
      ADD COLUMN IF NOT EXISTS "es_virtual" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "activa" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "metadata" jsonb
    `);

    await queryRunner.query(`
      UPDATE "ubicacion"
      SET "codigo" = substring(replace("id"::text, '-', ''), 1, 20)
      WHERE "codigo" IS NULL OR trim("codigo") = ''
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_ubicacion_codigo"
      ON "ubicacion" ("codigo")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_ubicacion_parent'
        ) THEN
          ALTER TABLE "ubicacion"
          ADD CONSTRAINT "FK_ubicacion_parent"
          FOREIGN KEY ("parent_id") REFERENCES "ubicacion"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ubicacion_parent_id" ON "ubicacion" ("parent_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ubicacion_organizacion_id" ON "ubicacion" ("organizacion_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "usuario_ubicacion"
      ADD COLUMN IF NOT EXISTS "puede_consultar" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "puede_transferir" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "es_ubicacion_predeterminada" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "scope_metadatos" jsonb
    `);

    await queryRunner.query(`
      UPDATE "usuario_ubicacion" uu
      SET "es_ubicacion_predeterminada" = true
      FROM "usuario" u
      WHERE u."id" = uu."usuario_id"
        AND u."ubicacion_id" IS NOT NULL
        AND u."ubicacion_id" = uu."ubicacion_id"
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "alumno_slot_ubicacion" (
        "alumno_slot_id" uuid NOT NULL,
        "ubicacion_id" uuid NOT NULL,
        "puede_consultar" boolean NOT NULL DEFAULT true,
        "scope_metadatos" jsonb,
        CONSTRAINT "PK_alumno_slot_ubicacion" PRIMARY KEY ("alumno_slot_id", "ubicacion_id"),
        CONSTRAINT "FK_asu_alumno_slot" FOREIGN KEY ("alumno_slot_id")
          REFERENCES "alumno_slot"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_asu_ubicacion" FOREIGN KEY ("ubicacion_id")
          REFERENCES "ubicacion"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_asu_ubicacion_id"
      ON "alumno_slot_ubicacion" ("ubicacion_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transferencia" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v7(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "deleted_by" uuid,
        "modified_by" uuid,
        "version" integer NOT NULL DEFAULT 1,
        "estado" character varying(24) NOT NULL DEFAULT 'completada',
        "usuario_id" uuid,
        "observaciones" text,
        "idempotencia_key" character varying(128),
        CONSTRAINT "PK_transferencia" PRIMARY KEY ("id"),
        CONSTRAINT "FK_transferencia_usuario" FOREIGN KEY ("usuario_id")
          REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_transferencia_idempotencia_key"
      ON "transferencia" ("idempotencia_key")
      WHERE "idempotencia_key" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_transferencia_estado" ON "transferencia" ("estado")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_transferencia_created_at" ON "transferencia" ("created_at")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transferencia_linea" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v7(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "deleted_by" uuid,
        "modified_by" uuid,
        "version" integer NOT NULL DEFAULT 1,
        "transferencia_id" uuid NOT NULL,
        "inventario_origen_id" uuid NOT NULL,
        "inventario_destino_id" uuid,
        "ubicacion_origen_id" uuid,
        "ubicacion_destino_id" uuid NOT NULL,
        "producto_proveedor_id" uuid NOT NULL,
        "cantidad" numeric(12,3) NOT NULL,
        CONSTRAINT "PK_transferencia_linea" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tl_transferencia" FOREIGN KEY ("transferencia_id")
          REFERENCES "transferencia"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_tl_inv_origen" FOREIGN KEY ("inventario_origen_id")
          REFERENCES "inventario"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_tl_inv_destino" FOREIGN KEY ("inventario_destino_id")
          REFERENCES "inventario"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_tl_pp" FOREIGN KEY ("producto_proveedor_id")
          REFERENCES "producto_proveedor"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_tl_u_origen" FOREIGN KEY ("ubicacion_origen_id")
          REFERENCES "ubicacion"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_tl_u_destino" FOREIGN KEY ("ubicacion_destino_id")
          REFERENCES "ubicacion"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "CHK_tl_cantidad_pos" CHECK ("cantidad" > 0)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tl_transferencia_id"
      ON "transferencia_linea" ("transferencia_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "movimiento"
      ADD COLUMN IF NOT EXISTS "ubicacion_origen_id" uuid,
      ADD COLUMN IF NOT EXISTS "ubicacion_destino_id" uuid,
      ADD COLUMN IF NOT EXISTS "transferencia_id" uuid,
      ADD COLUMN IF NOT EXISTS "idempotencia_key" character varying(128)
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_movimiento_ubicacion_origen'
        ) THEN
          ALTER TABLE "movimiento"
          ADD CONSTRAINT "FK_movimiento_ubicacion_origen"
          FOREIGN KEY ("ubicacion_origen_id") REFERENCES "ubicacion"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_movimiento_ubicacion_destino'
        ) THEN
          ALTER TABLE "movimiento"
          ADD CONSTRAINT "FK_movimiento_ubicacion_destino"
          FOREIGN KEY ("ubicacion_destino_id") REFERENCES "ubicacion"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_movimiento_transferencia'
        ) THEN
          ALTER TABLE "movimiento"
          ADD CONSTRAINT "FK_movimiento_transferencia"
          FOREIGN KEY ("transferencia_id") REFERENCES "transferencia"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_movimiento_idempotencia_key"
      ON "movimiento" ("idempotencia_key")
      WHERE "idempotencia_key" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_movimiento_transferencia_id"
      ON "movimiento" ("transferencia_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_movimiento_ubicaciones"
      ON "movimiento" ("ubicacion_origen_id", "ubicacion_destino_id")
    `);
  }

  /**
   * Revierte la migración (orden inverso, tolerante a FKs).
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_movimiento_ubicaciones"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_movimiento_transferencia_id"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_movimiento_idempotencia_key"`
    );
    await queryRunner.query(
      `ALTER TABLE "movimiento" DROP CONSTRAINT IF EXISTS "FK_movimiento_transferencia"`
    );
    await queryRunner.query(
      `ALTER TABLE "movimiento" DROP CONSTRAINT IF EXISTS "FK_movimiento_ubicacion_destino"`
    );
    await queryRunner.query(
      `ALTER TABLE "movimiento" DROP CONSTRAINT IF EXISTS "FK_movimiento_ubicacion_origen"`
    );
    await queryRunner.query(
      `ALTER TABLE "movimiento" DROP COLUMN IF EXISTS "idempotencia_key"`
    );
    await queryRunner.query(
      `ALTER TABLE "movimiento" DROP COLUMN IF EXISTS "transferencia_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "movimiento" DROP COLUMN IF EXISTS "ubicacion_destino_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "movimiento" DROP COLUMN IF EXISTS "ubicacion_origen_id"`
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "transferencia_linea"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transferencia"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "alumno_slot_ubicacion"`);

    await queryRunner.query(`
      ALTER TABLE "usuario_ubicacion" DROP COLUMN IF EXISTS "scope_metadatos"
    `);
    await queryRunner.query(`
      ALTER TABLE "usuario_ubicacion" DROP COLUMN IF EXISTS "es_ubicacion_predeterminada"
    `);
    await queryRunner.query(`
      ALTER TABLE "usuario_ubicacion" DROP COLUMN IF EXISTS "puede_transferir"
    `);
    await queryRunner.query(`
      ALTER TABLE "usuario_ubicacion" DROP COLUMN IF EXISTS "puede_consultar"
    `);

    await queryRunner.query(
      `ALTER TABLE "ubicacion" DROP CONSTRAINT IF EXISTS "FK_ubicacion_parent"`
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ubicacion_parent_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_ubicacion_organizacion_id"`
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_ubicacion_codigo"`);
    await queryRunner.query(`
      ALTER TABLE "ubicacion" DROP COLUMN IF EXISTS "metadata",
      DROP COLUMN IF EXISTS "activa",
      DROP COLUMN IF EXISTS "es_virtual",
      DROP COLUMN IF EXISTS "tipo",
      DROP COLUMN IF EXISTS "codigo",
      DROP COLUMN IF EXISTS "organizacion_id",
      DROP COLUMN IF EXISTS "parent_id"
    `);
  }
}
