/**
 * Documentación en español.
 */

/**
 * Documentación en español.
 */
export function mockBcryptForTests(): void {
  const bcrypt = require('bcrypt');

  // Guardar funciones originales
  const originalHash = bcrypt.hash.bind(bcrypt);
  const originalHashSync = bcrypt.hashSync.bind(bcrypt);

  // Override hash (async)
  bcrypt.hash = function (data: string, saltOrRounds: any, ...args: any[]) {
    const rounds = typeof saltOrRounds === 'number' ? 1 : saltOrRounds;
    return originalHash(data, rounds, ...args);
  };

  // Override hashSync (sync)
  bcrypt.hashSync = function (data: string, saltOrRounds: any) {
    const rounds = typeof saltOrRounds === 'number' ? 1 : saltOrRounds;
    return originalHashSync(data, rounds);
  };

  // Silenciar: console.log('⚡ bcrypt optimizado para tests (1 round)');
}
