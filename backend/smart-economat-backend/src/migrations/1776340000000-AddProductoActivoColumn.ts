import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Alinea `producto` con la entidad TypeORM: flag de catálogo operativo (sin soft-delete).
 */
export class AddProductoActivoColumn1776340000000 implements MigrationInterface {
  name = 'AddProductoActivoColumn1776340000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "producto"
      ADD COLUMN IF NOT EXISTS "activo" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "producto" DROP COLUMN IF EXISTS "activo"`
    );
  }
}
