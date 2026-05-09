import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Alinea `movimiento_tipo_enum` con {@link TipoMovimiento.TRANSFERENCIA}
 * ({@link InventarioTransferenciaStockService}).
 */
export class AddMovimientoTipoTransferencia1776320000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
            AND e.enumlabel = 'transferencia'
        ) THEN
          ALTER TYPE "public"."movimiento_tipo_enum" ADD VALUE 'transferencia';
        END IF;
      END $$;
    `);
  }

  public down(): Promise<void> {
    return Promise.resolve();
  }
}
