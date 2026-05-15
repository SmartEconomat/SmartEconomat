import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Añade `hurto` a `merma_tipo_enum` y `cancelado` a `produccion_lote_estado_enum`
 * para alinear dominio (MERMA-10, MERMA-07).
 */
export class MermaTipoHurtoProduccionLoteCancelado1776360100000 implements MigrationInterface {
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
            AND t.typname = 'merma_tipo_enum'
            AND e.enumlabel = 'hurto'
        ) THEN
          ALTER TYPE "public"."merma_tipo_enum" ADD VALUE 'hurto';
        END IF;
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
            AND t.typname = 'produccion_lote_estado_enum'
            AND e.enumlabel = 'cancelado'
        ) THEN
          ALTER TYPE "public"."produccion_lote_estado_enum" ADD VALUE 'cancelado';
        END IF;
      END $$;
    `);
  }

  public down(): Promise<void> {
    return Promise.resolve();
  }
}
