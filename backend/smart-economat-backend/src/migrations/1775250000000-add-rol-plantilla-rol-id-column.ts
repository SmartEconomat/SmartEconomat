import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Documentación en español.
 */
export class AddRolPlantillaRolIdColumn1775250000000 implements MigrationInterface {
  name = 'addRolPlantillaRolIdColumn1775250000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rol" ADD COLUMN IF NOT EXISTS "plantilla_rol_id" uuid`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_rol_plantilla_rol_id" ON "rol" ("plantilla_rol_id")`
    );

    await queryRunner.query(`
      UPDATE "rol"
      SET "plantilla_rol_id" = "plantilla_rol"."id"
      FROM "plantilla_rol"
      WHERE "rol"."plantilla_rol_id" IS NULL
        AND "rol"."deleted_at" IS NULL
        AND "plantilla_rol"."deleted_at" IS NULL
        AND UPPER("rol"."nombre") = UPPER("plantilla_rol"."nombre")
    `);

    await queryRunner.query(
      `ALTER TABLE "rol" DROP CONSTRAINT IF EXISTS "FK_rol_plantilla_rol_id_plantilla_rol"`
    );
    await queryRunner.query(
      `ALTER TABLE "rol" ADD CONSTRAINT "FK_rol_plantilla_rol_id_plantilla_rol" FOREIGN KEY ("plantilla_rol_id") REFERENCES "plantilla_rol"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rol" DROP CONSTRAINT IF EXISTS "FK_rol_plantilla_rol_id_plantilla_rol"`
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_rol_plantilla_rol_id"`);
    await queryRunner.query(
      `ALTER TABLE "rol" DROP COLUMN IF EXISTS "plantilla_rol_id"`
    );
  }
}
