/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

module.exports = (): void => {
  process.env.NODE_ENV = 'test';
  process.env.OFF_API_ENABLED = 'false';
  process.env.LOCAL_STORAGE_PATH = './uploads_test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
  process.env.JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
  process.env.DB_SYNC = 'false';
  process.env.ALLOW_PUBLIC_REGISTER =
    process.env.ALLOW_PUBLIC_REGISTER ?? 'true';
};
