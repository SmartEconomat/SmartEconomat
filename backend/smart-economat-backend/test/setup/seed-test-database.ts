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
 * Documentación en español.
 */

/**
 * Documentación en español.
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
 * Documentación en español.
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
 * Documentación en español.
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
 * Documentación en español.
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
 * Documentación en español.
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
