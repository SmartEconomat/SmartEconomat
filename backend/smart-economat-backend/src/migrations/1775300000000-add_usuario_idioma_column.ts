import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add the language (idioma) column to the usuario table.
 */
export class AddUsuarioIdiomaColumn1775300000000 implements MigrationInterface {
  name = 'addUsuarioIdiomaColumn1775300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuario" ADD COLUMN IF NOT EXISTS "idioma" character varying(5) DEFAULT 'es'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuario" DROP COLUMN IF EXISTS "idioma"`
    );
  }
}
