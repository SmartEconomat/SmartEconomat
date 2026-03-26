import { randomUUID } from 'node:crypto';
import { newDb, IMemoryDb, IBackup } from 'pg-mem';
import { DataSource } from 'typeorm';

/**
 * @file pg-mem.ts
 * @description Sistema de base de datos en memoria para testing de alta velocidad.
 *
 * Características:
 * - PostgreSQL en memoria (pg-mem)
 * - DataSource singleton de TypeORM
 * - Funciones UUID v7 y v4 personalizadas
 * - Sistema de snapshots para restauración instantánea
 * - Configuración optimizada para tests
 *
 * @author SmartEconomat Team
 */

const g = global as any;

/**
 * Genera un UUID v7 compatible (timestamp-based)
 * UUID v7 es ideal para claves primarias por su ordenamiento temporal natural
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
 * Inicializa la base de datos pg-mem con todas las funciones necesarias.
 * Esta función solo se ejecuta una vez por worker de Jest.
 *
 * @returns Objeto con la instancia de base de datos y el adaptador pg
 */
export function initPgMem(): { db: IMemoryDb; pg: any } {
  if (g.__PG_MEM_DB__) {
    return { db: g.__PG_MEM_DB__, pg: g.__PG_MEM_PG__ };
  }

  const db = newDb({
    autoCreateForeignKeyIndices: true,
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
 * Obtiene el DataSource de TypeORM conectado a pg-mem.
 * Se crea una vez y se reutiliza en todos los tests.
 *
 * @returns DataSource inicializado
 */
export async function getTestDataSource(): Promise<DataSource> {
  if (g.__TEST_DATASOURCE__) {
    const ds = g.__TEST_DATASOURCE__;
    if (!ds.isInitialized) {
      await ds.initialize();
    }
    return ds;
  }

  throw new Error(
    'DataSource no inicializado. Debe llamarse después de inicializar pg-mem y ejecutar seeders.'
  );
}

/**
 * Establece el DataSource de test en la variable global
 * @param dataSource DataSource inicializado
 */
export function setTestDataSource(dataSource: DataSource): void {
  g.__TEST_DATASOURCE__ = dataSource;
}

/**
 * Crea un snapshot (backup) del estado actual de la base de datos.
 * El snapshot captura TODO el estado: esquema, datos, secuencias, etc.
 *
 * Esta operación es extremadamente rápida (~0ms) porque es en memoria.
 *
 * @returns Backup que puede ser restaurado posteriormente
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
 * Restaura la base de datos a un snapshot específico.
 * Esta operación es instantánea (~0ms) y revierte TODOS los cambios.
 *
 * A diferencia de transacciones, restore() revierte incluso:
 * - Transacciones internas de servicios
 * - Commits de QueryRunners independientes
 * - Cambios en esquema (aunque no deberían ocurrir en tests)
 *
 * @param backup Snapshot a restaurar
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
 * Obtiene el snapshot de seeders (estado post-seed)
 * @returns Snapshot de seeders o null si no existe
 */
export function getSeedSnapshot(): IBackup | null {
  return g.__SEED_SNAPSHOT__ || null;
}

/**
 * Establece el snapshot de seeders
 * @param backup Snapshot a guardar
 */
export function setSeedSnapshot(backup: IBackup): void {
  g.__SEED_SNAPSHOT__ = backup;
}

/**
 * Obtiene el snapshot de archivo (estado post-beforeAll del archivo de test)
 * @returns Snapshot de archivo o null si no existe
 */
export function getFileSnapshot(): IBackup | null {
  return g.__FILE_SNAPSHOT__ || null;
}

/**
 * Establece el snapshot de archivo
 * @param backup Snapshot a guardar
 */
export function setFileSnapshot(backup: IBackup): void {
  g.__FILE_SNAPSHOT__ = backup;
}

/**
 * Limpia el snapshot de suite actual.
 */
export function clearFileSnapshot(): void {
  g.__FILE_SNAPSHOT__ = null;
}

/**
 * Limpia todos los snapshots y estado global
 * Se usa en globalTeardown
 */
export function cleanupPgMem(): void {
  g.__PG_MEM_DB__ = null;
  g.__PG_MEM_PG__ = null;
  g.__TEST_DATASOURCE__ = null;
  g.__SEED_SNAPSHOT__ = null;
  g.__FILE_SNAPSHOT__ = null;
  g.__SEEDED__ = false;
}

/**
 * Verifica si los seeders ya fueron ejecutados en este worker
 * @returns true si los seeders ya se ejecutaron
 */
export function isSeeded(): boolean {
  return g.__SEEDED__ === true;
}

/**
 * Marca los seeders como ejecutados
 */
export function markAsSeeded(): void {
  g.__SEEDED__ = true;
}
