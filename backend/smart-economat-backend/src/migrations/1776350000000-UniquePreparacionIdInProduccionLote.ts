import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Garantiza idempotencia: una preparación no debe generar más de un lote de producción.
 */
export class UniquePreparacionIdInProduccionLote1776350000000 implements MigrationInterface {
  name = 'UniquePreparacionIdInProduccionLote1776350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "produccion_lote" a
      USING "produccion_lote" b
      WHERE a."preparacion_id" = b."preparacion_id"
        AND a."preparacion_id" IS NOT NULL
        AND (
          a."created_at" > b."created_at"
          OR (
            a."created_at" = b."created_at"
            AND a."id"::text > b."id"::text
          )
        )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_produccion_lote_preparacion_unica"
      ON "produccion_lote" ("preparacion_id")
      WHERE "preparacion_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_produccion_lote_preparacion_unica"
    `);
  }
}
