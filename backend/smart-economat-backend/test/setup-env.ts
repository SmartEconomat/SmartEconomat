import { randomUUID } from 'node:crypto';
import { newDb } from 'pg-mem';
import type { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

const db = newDb();
db.public.registerFunction({
  name: 'current_database',
  implementation: () => 'test',
});
db.public.registerFunction({
  name: 'version',
  implementation: () => 'PostgreSQL 14.0',
});

/**
 * Genera un UUID v7 básico para propósitos de test.
 */
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
  name: 'uuid_generate_v7',
  implementation: () => uuidv7(),
  impure: true,
});
db.public.registerFunction({
  name: 'uuid_generate_v4',
  implementation: () => randomUUID() as string,
  impure: true,
});

process.env.DB_SYNC = 'false';
process.env.NODE_ENV = 'test';
process.env.LOCAL_STORAGE_PATH = './uploads_test';

const pg = db.adapters.createPg();
jest.mock('pg', () => pg);

jest.setTimeout(30000);

beforeAll(async () => {
  const { dataSource, runAllSeeders } = require('../src/seeders/seed') as {
    dataSource: DataSource;
    runAllSeeders: () => Promise<void>;
  };
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  await runAllSeeders();
});

afterAll(() => {
  const uploadDir = path.resolve(
    process.env.LOCAL_STORAGE_PATH || './uploads_test'
  );
  if (fs.existsSync(uploadDir)) {
    fs.rmSync(uploadDir, { recursive: true, force: true });
  }
});
