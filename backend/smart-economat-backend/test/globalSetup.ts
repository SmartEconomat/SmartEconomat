/**
 * Jest globalSetup - runs ONCE in the main Jest process before all workers start.
 *
 * IMPORTANT: This does NOT share memory with test workers.
 * - Do NOT initialize pg-mem here (workers can't see it).
 * - Do NOT run seeders here (workers have separate processes).
 * - ONLY set process.env variables, which ARE inherited by forked workers.
 *
 * The real per-worker setup (pg-mem, TypeORM patch, seeders, app bootstrap)
 * is handled by test/setup/jest.setup.ts via setupFilesAfterEnv.
 *
 * @author SmartEconomat Team
 */

module.exports = (): void => {
  // Variables de entorno compartidas entre todos los workers
  process.env.NODE_ENV = 'test';
  process.env.OFF_API_ENABLED = 'false';
  process.env.LOCAL_STORAGE_PATH = './uploads_test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
  process.env.JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
  process.env.DB_SYNC = 'false';
};
