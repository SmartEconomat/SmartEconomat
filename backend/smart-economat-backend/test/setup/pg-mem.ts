import { randomUUID } from 'node:crypto';
import { newDb, IMemoryDb, IBackup, DataType } from 'pg-mem';
import { DataSource } from 'typeorm';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

const g = global as any;

/**
 * Ejecuta la lógica de generate uuid v7 dentro del flujo de la aplicación.
 * @returns Valor resultante de la operación.
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
 * Ejecuta la lógica de init pg mem dentro del flujo de la aplicación.
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

  db.public.registerFunction({
    name: 'floor',
    args: [DataType.float],
    implementation: (value: number) => Math.floor(Number(value)),
  });

  /** pg-mem no expone TRIM(text/varchar) como PostgreSQL; lo usan queries TypeORM (p.ej. producto por nombre). */
  db.public.registerFunction({
    name: 'trim',
    args: [DataType.text],
    implementation: (value: string | null) =>
      value == null ? null : String(value).trim(),
  });

  db.public.interceptQueries((sql) => {
    if (
      sql.includes('FROM "information_schema"."columns"') &&
      sql.includes('"columns"."table_name"')
    ) {
      return [];
    }
    if (sql.toLowerCase().includes(' from pg_am')) {
      return [];
    }

    return null;
  });

  g.__PG_MEM_DB__ = db;
  g.__PG_MEM_PG__ = db.adapters.createPg();

  return { db: g.__PG_MEM_DB__, pg: g.__PG_MEM_PG__ };
}

/**
 * Obtiene test data source.
 * @returns Valor resultante de la operación.
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
 * Ejecuta la lógica de set test data source dentro del flujo de la aplicación.
 *
 * @param dataSource Parámetro de entrada para la operación.
 */
export function setTestDataSource(dataSource: DataSource): void {
  g.__TEST_DATASOURCE__ = dataSource;
}

/**
 * Ejecuta la lógica de peek test data source dentro del flujo de la aplicación.
 * @returns Valor resultante de la operación.
 */
export function peekTestDataSource(): DataSource | null {
  return g.__TEST_DATASOURCE__ || null;
}

/**
 * Ejecuta la lógica de take snapshot dentro del flujo de la aplicación.
 * @returns Valor resultante de la operación.
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
 * Ejecuta la lógica de restore snapshot dentro del flujo de la aplicación.
 *
 * @param backup Parámetro de entrada para la operación.
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
 * Obtiene seed snapshot.
 * @returns Valor resultante de la operación.
 */
export function getSeedSnapshot(): IBackup | null {
  return g.__SEED_SNAPSHOT__ || null;
}

/**
 * Ejecuta la lógica de set seed snapshot dentro del flujo de la aplicación.
 *
 * @param backup Parámetro de entrada para la operación.
 */
export function setSeedSnapshot(backup: IBackup): void {
  g.__SEED_SNAPSHOT__ = backup;
}

/**
 * Obtiene file snapshot.
 * @returns Valor resultante de la operación.
 */
export function getFileSnapshot(): IBackup | null {
  return g.__FILE_SNAPSHOT__ || null;
}

/**
 * Ejecuta la lógica de set file snapshot dentro del flujo de la aplicación.
 *
 * @param backup Parámetro de entrada para la operación.
 */
export function setFileSnapshot(backup: IBackup): void {
  g.__FILE_SNAPSHOT__ = backup;
}

/**
 * Ejecuta la lógica de clear file snapshot dentro del flujo de la aplicación.
 */
export function clearFileSnapshot(): void {
  g.__FILE_SNAPSHOT__ = null;
}

/**
 * Ejecuta la lógica de cleanup pg mem dentro del flujo de la aplicación.
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
 * Determina si seeded.
 * @returns Valor resultante de la operación.
 */
export function isSeeded(): boolean {
  return g.__SEEDED__ === true;
}

/**
 * Ejecuta la lógica de mark as seeded dentro del flujo de la aplicación.
 */
export function markAsSeeded(): void {
  g.__SEEDED__ = true;
}
