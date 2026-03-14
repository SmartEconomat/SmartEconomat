import { DataSource } from 'typeorm';
import {
  initPgMem,
  takeSnapshot,
  setSeedSnapshot,
  setTestDataSource,
  isSeeded,
  markAsSeeded,
  getSeedSnapshot,
  restoreSnapshot,
} from './pg-mem';

/**
 * @file seed-test-database.ts
 * @description Sistema de seeders optimizado para tests.
 *
 * Estrategia:
 * 1. Los seeders se ejecutan UNA SOLA VEZ por worker de Jest
 * 2. Después de ejecutar seeders, se crea un snapshot
 * 3. Los tests restauran el snapshot en lugar de re-ejecutar seeders
 *
 * Esto reduce el tiempo de setup de ~5-10s a ~0ms por test.
 *
 * @author SmartEconomat Team
 */

/**
 * Ejecuta todos los seeders del proyecto y crea un snapshot.
 * Esta función solo se ejecuta una vez por worker de Jest.
 *
 * @returns DataSource inicializado con datos de seeders
 */
async function runSeedersSilently(
  runAllSeeders: () => Promise<void>
): Promise<void> {
  if (process.env.NODE_ENV !== 'test') {
    await runAllSeeders();
    return;
  }

  const originalLog = console.log;
  const originalWarn = console.warn;

  console.log = () => undefined;
  console.warn = () => undefined;

  try {
    await runAllSeeders();
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
  }
}

export async function seedTestDatabase(): Promise<DataSource> {
  const seedSnapshot = getSeedSnapshot();
  if (seedSnapshot && isSeeded()) {
    restoreSnapshot(seedSnapshot);

    const { dataSource } = require('../../src/seeders/seed');
    return dataSource;
  }

  initPgMem();

  const { dataSource, runAllSeeders } = require('../../src/seeders/seed') as {
    dataSource: DataSource;
    runAllSeeders: () => Promise<void>;
  };

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  setTestDataSource(dataSource);

  await runSeedersSilently(runAllSeeders);
  markAsSeeded();

  const backup = takeSnapshot('seed-snapshot');
  setSeedSnapshot(backup);

  return dataSource;
}

/**
 * Restaura la base de datos al estado post-seeders.
 * Esta operación es instantánea (~0ms).
 *
 * Se usa en:
 * - beforeAll de cada archivo de test (restaurar al estado seed limpio)
 * - Manualmente si un test necesita resetear a estado inicial
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
 * Útil cuando los tests necesitan acceso directo al DataSource.
 *
 * @returns DataSource inicializado
 */
export function getSeededDataSource(): DataSource {
  const { dataSource } = require('../../src/seeders/seed');

  if (!dataSource || !dataSource.isInitialized) {
    throw new Error(
      'DataSource no está inicializado. ' +
        'Asegúrate de que seedTestDatabase() se haya ejecutado primero.'
    );
  }

  return dataSource;
}
