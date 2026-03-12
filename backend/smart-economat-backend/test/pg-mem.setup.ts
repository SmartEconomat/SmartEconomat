import { randomUUID } from 'node:crypto';
import { newDb, IMemoryDb, IBackup } from 'pg-mem';

/**
 * @file pg-mem.setup.ts
 * @description Configuración centralizada de pg-mem para los tests E2E y unitarios.
 * Abstrae la inicialización de la base de datos en memoria y la gestión de snapshots.
 */

const g = global as any;

/**
 * Inicializa la base de datos en memoria si no existe.
 * Registra funciones personalizadas requeridas por la aplicación (e.g. uuid_generate_v7).
 */
export function initPgMem(): { db: IMemoryDb; pg: any } {
  if (g.__PG_MEM_DB__) {
    return { db: g.__PG_MEM_DB__, pg: g.__PG_MEM_PG__ };
  }

  console.log('Iniciando tests con pg-mem optimizado...');

  require('pg');

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

  return { db: g.__PG_MEM_DB__, pg: g.__PG_MEM_PG__ };
}

/**
 * Crea un snapshot (backup) del estado actual de la base de datos en memoria.
 * Debe llamarse DESPUÉS de sincronizar el esquema y ejecutar los seeders.
 */
export function takeSnapshot(): void {
  if (!g.__PG_MEM_DB__) {
    throw new Error(
      'pg-mem no ha sido inicializado. Llama a initPgMem() primero.'
    );
  }
  g.__PG_MEM_SNAPSHOT__ = (g.__PG_MEM_DB__ as IMemoryDb).backup();
}

/**
 * Restaura la base de datos en memoria al estado del último snapshot.
 * Debe llamarse en el `beforeEach` de las suites de prueba.
 */
export function restoreSnapshot(): void {
  const snapshot = g.__PG_MEM_SNAPSHOT__ as IBackup | undefined;
  if (!snapshot) {
    throw new Error(
      'No hay un snapshot disponible. Llama a takeSnapshot() primero.'
    );
  }
  snapshot.restore();
}
