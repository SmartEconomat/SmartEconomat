import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Regresión: SherlockAuth debe asegurar columna antes de cualquier UPDATE a plantilla_rol_id.
 */
describe('SherlockAuthMigration rol.plantilla_rol_id', () => {
  it('up() empieza con ADD COLUMN IF NOT EXISTS plantilla_rol_id en rol', () => {
    const file = path.join(
      __dirname,
      '../../src/migrations/1775050000000-SherlockAuthMigration.ts'
    );
    const src = fs.readFileSync(file, 'utf8');
    const idx = src.indexOf('public async up(queryRunner');
    expect(idx).toBeGreaterThanOrEqual(0);
    const head = src.slice(idx, idx + 800);
    expect(head).toMatch(/ADD COLUMN IF NOT EXISTS "plantilla_rol_id"/);
  });
});
