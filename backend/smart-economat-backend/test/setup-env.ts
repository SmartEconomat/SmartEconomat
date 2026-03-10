import { randomUUID } from 'node:crypto';
import { newDb } from 'pg-mem';
import type { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

const g = global as any;

if (!g.__PG_MEM_DB__) {
  const db = newDb();

  const uuidv7 = () => {
    const timestamp = Date.now();
    const hex = timestamp.toString(16).padStart(12, '0');
    const p1 = hex.substring(0, 8);
    const p2 = hex.substring(8, 12);
    const p3 =
      '7' +
      Math.floor(Math.random() * 0x1000)
        .toString(16)
        .padStart(3, '0');
    const p4 =
      (8 + Math.floor(Math.random() * 4)).toString(16) +
      Math.floor(Math.random() * 0x1000)
        .toString(16)
        .padStart(3, '0');
    const p5 = Array.from({ length: 12 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return `${p1}-${p2}-${p3}-${p4}-${p5}`;
  };

  db.public.registerFunction({
    name: 'current_database',
    implementation: () => 'test',
  });
  db.public.registerFunction({
    name: 'version',
    implementation: () => 'PostgreSQL 14.0',
  });
  db.public.registerFunction({
    name: 'uuid_generate_v7',
    implementation: () => uuidv7(),
    impure: true,
  });
  db.public.registerFunction({
    name: 'uuid_generate_v4',
    implementation: () => randomUUID() as string,
    impure: true,
  });

  g.__PG_MEM_DB__ = db;
  g.__PG_MEM_PG__ = db.adapters.createPg();
}

process.env.DB_SYNC = 'false';
process.env.NODE_ENV = 'test';
process.env.LOCAL_STORAGE_PATH = './uploads_test';

// Mock pg con la misma instancia compartida
jest.mock('pg', () => g.__PG_MEM_PG__);

jest.setTimeout(5000);

beforeAll(async () => {
  const { dataSource } = require('../src/seeders/seed') as {
    dataSource: DataSource;
  };
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  // Seeders esenciales solo 1 vez
  if (!g.__SEEDED__) {
    const rolesSeeder = require('../src/seeders/roles-permisos.seeder');
    await rolesSeeder.runSeeder(dataSource);

    const usuarioSeeder = require('../src/seeders/usuario.seeder');
    await usuarioSeeder.runSeeder(dataSource);

    g.__SEEDED__ = true;
  }
}, 15000);

afterAll(() => {
  const uploadDir = path.resolve(
    process.env.LOCAL_STORAGE_PATH || './uploads_test'
  );
  if (fs.existsSync(uploadDir)) {
    fs.rmSync(uploadDir, { recursive: true, force: true });
  }
});
