import { randomUUID } from 'node:crypto';
import { newDb } from 'pg-mem';
import { AddRolPlantillaRolIdColumn1775250000000 } from '../../src/migrations/1775250000000-add-rol-plantilla-rol-id-column';

/**
 * Aislado de jest.setup / pg-mem global: valida SQL de migración contra memoria limpia.
 * Evita restore de snapshot tras cambiar esquema (limitación pg-mem).
 */
describe('AddRolPlantillaRolIdColumn1775250000000 (pg-mem aislado)', () => {
  it('up añade columna, FK, backfill por nombre (equivale a fix 42703 login)', async () => {
    const db = newDb({ autoCreateForeignKeyIndices: true });
    db.public.registerFunction({
      name: 'uuid_generate_v7',
      implementation: () => randomUUID(),
      impure: true,
    });

    db.public.none(
      `CREATE TABLE "plantilla_rol" ("id" uuid PRIMARY KEY, "nombre" varchar(100) NOT NULL, "deleted_at" timestamptz)`
    );
    db.public.none(
      `CREATE TABLE "rol" ("id" uuid PRIMARY KEY, "nombre" varchar(100) NOT NULL, "deleted_at" timestamptz)`
    );

    const plantillaId = randomUUID();
    const rolId = randomUUID();
    db.public.none(
      `INSERT INTO "plantilla_rol" ("id","nombre") VALUES ('${plantillaId}','ADMIN')`
    );
    db.public.none(
      `INSERT INTO "rol" ("id","nombre") VALUES ('${rolId}','ADMIN')`
    );

    const migration = new AddRolPlantillaRolIdColumn1775250000000();
    const queryRunner = {
      query: (sql: string, parameters?: unknown[]) =>
        db.public.none(sql, parameters as never[] | undefined),
    };

    await migration.up(queryRunner as import('typeorm').QueryRunner);

    const cols = db.public.many(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'rol' AND column_name = 'plantilla_rol_id'`
    ) as Array<{ column_name: string }>;

    expect(cols.length).toBeGreaterThanOrEqual(1);

    const linked = db.public.one(
      `SELECT "plantilla_rol_id" AS pr FROM "rol" WHERE "id" = '${rolId}'`
    ) as { pr: string | null };

    expect(linked.pr).toBe(plantillaId);
  });
});
