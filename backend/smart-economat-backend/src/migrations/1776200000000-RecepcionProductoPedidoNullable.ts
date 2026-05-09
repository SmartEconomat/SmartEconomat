import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Las líneas de recepción por producto nuevo (extra/albarán) no tienen pedido_producto;
 * ya se persistían con pedido_producto nulo en código, pero la columna era NOT NULL.
 */
export class RecepcionProductoPedidoNullable1776200000000 implements MigrationInterface {
  name = 'RecepcionProductoPedidoNullable1776200000000';

  /**
   * Ejecuta la migración hacia adelante.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recepcion_producto" DROP CONSTRAINT IF EXISTS "FK_b0f146177ebdc8c20aaf1d27a68"`
    );
    await queryRunner.query(
      `ALTER TABLE "recepcion_producto" ALTER COLUMN "pedido_producto_id" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "recepcion_producto" ADD CONSTRAINT "FK_b0f146177ebdc8c20aaf1d27a68" FOREIGN KEY ("pedido_producto_id") REFERENCES "pedido_producto"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
  }

  /**
   * Revierte la migración.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recepcion_producto" DROP CONSTRAINT IF EXISTS "FK_b0f146177ebdc8c20aaf1d27a68"`
    );
    await queryRunner.query(
      `DELETE FROM "recepcion_producto" WHERE "pedido_producto_id" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "recepcion_producto" ALTER COLUMN "pedido_producto_id" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "recepcion_producto" ADD CONSTRAINT "FK_b0f146177ebdc8c20aaf1d27a68" FOREIGN KEY ("pedido_producto_id") REFERENCES "pedido_producto"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
  }
}
