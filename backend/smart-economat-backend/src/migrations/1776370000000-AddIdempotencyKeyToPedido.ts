import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * PEDIDO-001: Añade columna idempotency_key (nullable, unique cuando presente)
 * a la tabla pedido para soportar deduplicación de pedidos en reintentos de red.
 */
export class AddIdempotencyKeyToPedido1776370000000 implements MigrationInterface {
  name = 'AddIdempotencyKeyToPedido1776370000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pedido" ADD COLUMN IF NOT EXISTS "idempotency_key" uuid`
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_pedido_idempotency_key"
       ON "pedido" ("idempotency_key")
       WHERE "idempotency_key" IS NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_pedido_idempotency_key"`);
    await queryRunner.query(
      `ALTER TABLE "pedido" DROP COLUMN IF EXISTS "idempotency_key"`
    );
  }
}
