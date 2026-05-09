import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfill de estado CONSOLIDADO para pedidos de usuario históricos.
 *
 * Objetivo de dominio:
 * - `APROBADO` = validado/permitido (aprobación funcional)
 * - `CONSOLIDADO` = incluido en el cierre semanal (lote creado)
 *
 * Históricamente el sistema asignaba `pedido.batch_id` también durante la aprobación,
 * y la UI bloqueaba consolidación por `batchId != null`. Para desacoplar conceptos,
 * migramos los registros que ya tienen lote asociado a `estado = 'consolidado'`.
 */
export class BackfillPedidoUsuarioConsolidadoFromBatch1776100000000 implements MigrationInterface {
  name = 'BackfillPedidoUsuarioConsolidadoFromBatch1776100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        ALTER TYPE "public"."estado_pedido_usuario" ADD VALUE IF NOT EXISTS 'consolidado';
      EXCEPTION
        WHEN undefined_object THEN
          NULL;
      END $$;
    `);

    await queryRunner.query(`
      UPDATE "pedido_usuario" pu
      SET "estado" = 'consolidado'::estado_pedido_usuario
      WHERE pu."deleted_at" IS NULL
        AND pu."estado" IN ('pendiente', 'aprobado')
        AND EXISTS (
          SELECT 1
          FROM "pedido" p
          WHERE p."deleted_at" IS NULL
            AND p."pedido_usuario_id" = pu."id"
            AND p."batch_id" IS NOT NULL
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "pedido_usuario"
      SET "estado" = 'aprobado'::estado_pedido_usuario
      WHERE "deleted_at" IS NULL
        AND "estado" = 'consolidado';
    `);
  }
}
