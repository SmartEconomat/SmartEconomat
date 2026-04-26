import { randomUUID } from 'node:crypto';
import { newDb, IMemoryDb, IBackup } from 'pg-mem';
import { DataSource } from 'typeorm';

/**
 * Documentación en español.
 */

const g = global as any;

/**
 * Documentación en español.
 */
function generateUuidV7(): string {
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
}

/**
 * Documentación en español.
 */
export function initPgMem(): { db: IMemoryDb; pg: any } {
  if (g.__PG_MEM_DB__) {
    return { db: g.__PG_MEM_DB__, pg: g.__PG_MEM_PG__ };
  }

  const db = newDb({
    autoCreateForeignKeyIndices: true,
  });
  const createdEnumTypes = new Set<string>();

  db.public.interceptQueries((sql) => {
    const match = sql.match(
      /^CREATE TYPE "([^"]+)"\."([^"]+)" AS ENUM\((.*)\)$/i
    );

    if (!match) {
      return null;
    }

    const enumKey = `${match[1]}.${match[2]}`;
    if (createdEnumTypes.has(enumKey)) {
      return [];
    }

    createdEnumTypes.add(enumKey);
    return null;
  });

  db.public.registerFunction({
    name: 'current_database',
    implementation: () => 'test',
  });

  db.public.registerFunction({
    name: 'version',
    implementation: () => 'PostgreSQL 14.0 (pg-mem)',
  });

  db.public.registerFunction({
    name: 'uuid_generate_v7',
    implementation: () => generateUuidV7(),
    impure: true,
  });

  db.public.registerFunction({
    name: 'uuid_generate_v4',
    implementation: () => randomUUID() as string,
    impure: true,
  });

  g.__PG_MEM_DB__ = db;
  g.__PG_MEM_PG__ = db.adapters.createPg();

  return { db: g.__PG_MEM_DB__, pg: g.__PG_MEM_PG__ };
}

/**
 * Documentación en español.
 */
export async function getTestDataSource(): Promise<DataSource> {
  if (g.__TEST_DATASOURCE__) {
    const ds = g.__TEST_DATASOURCE__;
    if (!ds.isInitialized) {
      await ds.initialize();
    }
    return ds;
  }

  const { initTestDataSource } = require('./seed-test-database') as {
    initTestDataSource: () => Promise<DataSource>;
  };

  return initTestDataSource();
}

/**
 * Documentación en español.
 */
export function setTestDataSource(dataSource: DataSource): void {
  g.__TEST_DATASOURCE__ = dataSource;
}

/**
 * Documentación en español.
 */
export function peekTestDataSource(): DataSource | null {
  return g.__TEST_DATASOURCE__ || null;
}

/**
 * Documentación en español.
 */
export function takeSnapshot(): IBackup {
  if (!g.__PG_MEM_DB__) {
    throw new Error(
      'pg-mem no inicializado. Debe llamar a initPgMem() primero.'
    );
  }

  const backup = g.__PG_MEM_DB__.backup();

  return backup;
}

/**
 * Documentación en español.
 */
export function restoreSnapshot(backup: IBackup): void {
  if (!backup) {
    throw new Error(
      'Snapshot no disponible. Debe llamar a takeSnapshot() primero.'
    );
  }

  backup.restore();
}

/**
 * Documentación en español.
 */
export function getSeedSnapshot(): IBackup | null {
  return g.__SEED_SNAPSHOT__ || null;
}

/**
 * Documentación en español.
 */
export function setSeedSnapshot(backup: IBackup): void {
  g.__SEED_SNAPSHOT__ = backup;
}

/**
 * Documentación en español.
 */
export function getFileSnapshot(): IBackup | null {
  return g.__FILE_SNAPSHOT__ || null;
}

/**
 * Documentación en español.
 */
export function setFileSnapshot(backup: IBackup): void {
  g.__FILE_SNAPSHOT__ = backup;
}

/**
 * Documentación en español.
 */
export function clearFileSnapshot(): void {
  g.__FILE_SNAPSHOT__ = null;
}

/**
 * Documentación en español.
 */
export function cleanupPgMem(): void {
  g.__PG_MEM_DB__ = null;
  g.__PG_MEM_PG__ = null;
  g.__TEST_DATASOURCE__ = null;
  g.__TEST_DATASOURCE_INIT_PROMISE__ = null;
  g.__TEST_SEED_PROMISE__ = null;
  g.__SEED_SNAPSHOT__ = null;
  g.__FILE_SNAPSHOT__ = null;
  g.__SEEDED__ = false;
}

/**
 * Documentación en español.
 */
export function isSeeded(): boolean {
  return g.__SEEDED__ === true;
}

/**
 * Documentación en español.
 */
export function markAsSeeded(): void {
  g.__SEEDED__ = true;
}
