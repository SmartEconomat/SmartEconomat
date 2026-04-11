import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlantillaRolIdToRol1775300001000 implements MigrationInterface {
  public readonly name = 'AddPlantillaRolIdToRol1775300001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        table_record RECORD;
      BEGIN
        FOR table_record IN
          SELECT source.table_name
          FROM information_schema.columns source
          WHERE source.table_schema = 'public'
            AND source.column_name = 'deleted_by'
            AND NOT EXISTS (
              SELECT 1
              FROM information_schema.columns target
              WHERE target.table_schema = 'public'
                AND target.table_name = source.table_name
                AND target.column_name = 'modified_by'
            )
        LOOP
          EXECUTE format(
            'ALTER TABLE public.%I ADD COLUMN modified_by uuid',
            table_record.table_name
          );
        END LOOP;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "rol"
      ADD COLUMN IF NOT EXISTS "plantilla_rol_id" uuid
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_rol_plantilla_rol_id"
      ON "rol" ("plantilla_rol_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_rol_plantilla_rol_id'
        ) THEN
          ALTER TABLE "rol"
          ADD CONSTRAINT "FK_rol_plantilla_rol_id"
          FOREIGN KEY ("plantilla_rol_id")
          REFERENCES "plantilla_rol"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "rol"
      DROP CONSTRAINT IF EXISTS "FK_rol_plantilla_rol_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_rol_plantilla_rol_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "rol"
      DROP COLUMN IF EXISTS "plantilla_rol_id"
    `);
  }
}
