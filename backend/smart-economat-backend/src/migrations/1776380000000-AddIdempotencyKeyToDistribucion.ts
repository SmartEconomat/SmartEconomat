import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * DISTRIBUCION-002: Añade columna idempotency_key (nullable, unique cuando presente)
 * a la tabla distribucion para prevenir distribuciones duplicadas por doble clic o retry.
 */
export class AddIdempotencyKeyToDistribucion1776380000000 implements MigrationInterface {
  name = 'AddIdempotencyKeyToDistribucion1776380000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "distribucion" ADD COLUMN IF NOT EXISTS "idempotency_key" uuid`
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_distribucion_idempotency_key"
       ON "distribucion" ("idempotency_key")
       WHERE "idempotency_key" IS NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_distribucion_idempotency_key"`
    );
    await queryRunner.query(
      `ALTER TABLE "distribucion" DROP COLUMN IF EXISTS "idempotency_key"`
    );
  }
}
