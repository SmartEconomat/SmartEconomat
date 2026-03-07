import { newDb } from 'pg-mem';
import type { DataSource } from 'typeorm';

const db = newDb();
db.public.registerFunction({
  name: 'current_database',
  implementation: () => 'test',
});
db.public.registerFunction({
  name: 'version',
  implementation: () => 'PostgreSQL 14.0',
});

const crypto = require('crypto') as typeof import('crypto');
db.public.registerFunction({
  name: 'uuid_generate_v7',
  implementation: () => crypto.randomUUID(),
  impure: true,
});
db.public.registerFunction({
  name: 'uuid_generate_v4',
  implementation: () => crypto.randomUUID(),
  impure: true,
});

process.env.DB_SYNC = 'false';
process.env.NODE_ENV = 'test';

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
