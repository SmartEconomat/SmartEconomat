/**
 * @file setup/index.ts
 * @description Exportaciones centralizadas del sistema de testing
 *
 * Este archivo facilita los imports en tests:
 *
 * ```typescript
 * // En lugar de:
 * import { getTestApp } from './setup/test-app';
 * import { loginAndGetToken } from './utils/test-helpers';
 *
 * // Puedes usar:
 * import { getTestApp, loginAndGetToken } from './setup';
 * ```
 *
 * @author SmartEconomat Team
 */

// ============================================================================
// PG-MEM
// ============================================================================
export {
  initPgMem,
  getTestDataSource,
  setTestDataSource,
  takeSnapshot,
  restoreSnapshot,
  getSeedSnapshot,
  setSeedSnapshot,
  getFileSnapshot,
  setFileSnapshot,
  cleanupPgMem,
  isSeeded,
  markAsSeeded,
} from './pg-mem';

// ============================================================================
// SEEDERS
// ============================================================================
export {
  seedTestDatabase,
  restoreToSeedState,
  getSeededDataSource,
} from './seed-test-database';

// ============================================================================
// APP
// ============================================================================
export {
  getTestApp,
  closeTestApp,
  isTestAppInitialized,
  getTestServer,
} from './test-app';

// ============================================================================
// BCRYPT MOCK
// ============================================================================
export { mockBcryptForTests } from './bcrypt-mock';
