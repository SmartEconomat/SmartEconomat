import { randomUUID } from 'node:crypto';
import { newDb } from 'pg-mem';
import type { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

const envPaths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '.env.test'),
  path.join(process.cwd(), '../../.env'),
  path.join(process.cwd(), '../../.env.dev'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`Loaded environment from ${envPath}`);
    break;
  }
}

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

process.env.DB_SYNC = process.env.DB_SYNC || 'false';
process.env.NODE_ENV = 'test';
process.env.LOCAL_STORAGE_PATH =
  process.env.LOCAL_STORAGE_PATH || './uploads_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-mock';
process.env.JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';

const { PlatformTools } = require('typeorm/platform/PlatformTools');
const originalLoad = PlatformTools.load.bind(PlatformTools);
PlatformTools.load = function (name: string) {
  if (name === 'pg') {
    return g.__PG_MEM_PG__;
  }
  return originalLoad(name);
};

jest.setTimeout(60000);

beforeAll(async () => {
  const { dataSource, runAllSeeders } = (await import(
    '../src/seeders/seed'
  )) as {
    dataSource: DataSource;
    runAllSeeders: () => Promise<void>;
  };
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  if (!g.__SEEDED__) {
    await runAllSeeders();
    g.__SEEDED__ = true;

    g.__BACKUP__ = (g.__PG_MEM_DB__ as IMemoryDb).backup();
  }
}, 30000);

beforeEach(() => {
  const backup = g.__BACKUP__ as IBackup;
  if (backup) {
    backup.restore();
  }
});

afterAll(async () => {
  const uploadDir = path.resolve(
    process.env.LOCAL_STORAGE_PATH || './uploads_test'
  );
  if (fs.existsSync(uploadDir)) {
    fs.rmSync(uploadDir, { recursive: true, force: true });
  }

  const { dataSource } = (await import('../src/seeders/seed')) as {
    dataSource: DataSource;
  };
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }

  const { closeTestApp } = await import('./test-app.helper');
  await closeTestApp();
});
