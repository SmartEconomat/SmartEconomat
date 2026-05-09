import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Las aulas (alumno_slot) no llevan ubicación operativa; solo el usuario/inventario sí.
 */
export class RemoveUbicacionFromAlumnoSlot1776000000000 implements MigrationInterface {
  name = 'RemoveUbicacionFromAlumnoSlot1776000000000';

  /**
   * Ejecuta la migración hacia adelante.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alumno_slot" DROP CONSTRAINT IF EXISTS "FK_alumno_slot_ubicacion_id"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_alumno_slot_ubicacion_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "alumno_slot" DROP COLUMN IF EXISTS "ubicacion_id"`
    );
  }

  /**
   * Revierte la migración.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alumno_slot" ADD COLUMN IF NOT EXISTS "ubicacion_id" uuid`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_alumno_slot_ubicacion_id" ON "alumno_slot" ("ubicacion_id")`
    );
    await queryRunner.query(`
      ALTER TABLE "alumno_slot"
      ADD CONSTRAINT "FK_alumno_slot_ubicacion_id"
      FOREIGN KEY ("ubicacion_id") REFERENCES "ubicacion"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }
}
