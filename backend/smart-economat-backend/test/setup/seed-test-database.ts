import { DataSource } from 'typeorm';
import { dbConfig } from '../../src/config/database.config';
import {
  initPgMem,
  peekTestDataSource,
  takeSnapshot,
  setSeedSnapshot,
  setTestDataSource,
  isSeeded,
  markAsSeeded,
  getSeedSnapshot,
  restoreSnapshot,
} from './pg-mem';
import { seedTestBaseline } from './test-seed-baseline';

type TestSetupGlobal = typeof globalThis & {
  __TEST_DATASOURCE_INIT_PROMISE__?: Promise<DataSource> | null;
  __TEST_SEED_PROMISE__?: Promise<DataSource> | null;
};

const g = global as TestSetupGlobal;

/**
 * @file seed-test-database.ts
 * @description Sistema de seeders optimizado para tests.
 *
 * Estrategia:
 * 1. Inicializar pg-mem y DataSource (schema creado via synchronize:true)
 * 2. Inicializar app NestJS (ya tiene un DataSource listo)
 * 3. Ejecutar seeders con la app disponible para servicios de DI
 * 4. Crear snapshot
 * 5. En cada test restaurar snapshot (instantáneo)
 *
 * @author SmartEconomat Team
 */

/**
 * Fase 1: Inicializa pg-mem + DataSource (sin correr seeders).
 * Debe llamarse ANTES de crear la app NestJS.
 */
export async function initTestDataSource(): Promise<DataSource> {
  const existingDataSource = peekTestDataSource();
  if (existingDataSource?.isInitialized) {
    return existingDataSource;
  }

  if (g.__TEST_DATASOURCE_INIT_PROMISE__) {
    return g.__TEST_DATASOURCE_INIT_PROMISE__;
  }

  g.__TEST_DATASOURCE_INIT_PROMISE__ = (async () => {
    initPgMem();

    const dataSource = new DataSource({
      ...dbConfig,
      synchronize: true,
      dropSchema: false,
      logging: false,
    });

    await dataSource.initialize();
    setTestDataSource(dataSource);

    return dataSource;
  })();

  try {
    return await g.__TEST_DATASOURCE_INIT_PROMISE__;
  } finally {
    g.__TEST_DATASOURCE_INIT_PROMISE__ = null;
  }
}

/**
 * Fase 2: Ejecuta seeders (requiere que la app NestJS ya esté creada).
 * El seeder de roles-permisos necesita context.get() con servicios de NestJS.
 */
export async function runTestSeeders(): Promise<DataSource> {
  const seedSnapshot = getSeedSnapshot();
  if (seedSnapshot && isSeeded()) {
    return getSeededDataSource();
  }

  if (g.__TEST_SEED_PROMISE__) {
    return g.__TEST_SEED_PROMISE__;
  }

  g.__TEST_SEED_PROMISE__ = (async () => {
    const dataSource = await initTestDataSource();

    const currentSeedSnapshot = getSeedSnapshot();
    if (currentSeedSnapshot && isSeeded()) {
      return dataSource;
    }

    await seedTestBaseline(dataSource);
    markAsSeeded();

    const backup = takeSnapshot();
    setSeedSnapshot(backup);

    return dataSource;
  })();

  try {
    return await g.__TEST_SEED_PROMISE__;
  } finally {
    g.__TEST_SEED_PROMISE__ = null;
  }
}

/**
 * Función de compatibilidad: inicializa DataSource + seeders en un solo paso.
 * Solo usar cuando no se necesite DI de NestJS en los seeders.
 */
export async function seedTestDatabase(): Promise<DataSource> {
  const ds = await initTestDataSource();

  const seedSnapshot = getSeedSnapshot();
  if (seedSnapshot && isSeeded()) {
    return ds;
  }

  return runTestSeeders();
}

/**
 * Restaura la base de datos al estado post-seeders.
 * Esta operación es instantánea (~0ms).
 */
export function restoreToSeedState(): void {
  const seedSnapshot = getSeedSnapshot();

  if (!seedSnapshot) {
    throw new Error(
      'No hay snapshot de seeders disponible. ' +
        'Asegúrate de que seedTestDatabase() se haya ejecutado primero.'
    );
  }

  restoreSnapshot(seedSnapshot);
}

/**
 * Obtiene el DataSource de TypeORM para uso en tests.
 */
export function getSeededDataSource(): DataSource {
  const dataSource = peekTestDataSource();

  if (!dataSource || !dataSource.isInitialized) {
    throw new Error(
      'DataSource no está inicializado. ' +
        'Asegúrate de que seedTestDatabase() se haya ejecutado primero.'
    );
  }

  return dataSource;
}
