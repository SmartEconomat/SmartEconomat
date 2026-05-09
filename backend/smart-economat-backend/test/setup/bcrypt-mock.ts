/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

/**
 * Ejecuta la lógica de mock bcrypt for tests dentro del flujo de la aplicación.
 */
export function mockBcryptForTests(): void {
  const bcrypt = require('bcrypt');

  const originalHash = bcrypt.hash.bind(bcrypt);
  const originalHashSync = bcrypt.hashSync.bind(bcrypt);

  bcrypt.hash = function (data: string, saltOrRounds: any, ...args: any[]) {
    const rounds = typeof saltOrRounds === 'number' ? 1 : saltOrRounds;
    return originalHash(data, rounds, ...args);
  };

  bcrypt.hashSync = function (data: string, saltOrRounds: any) {
    const rounds = typeof saltOrRounds === 'number' ? 1 : saltOrRounds;
    return originalHashSync(data, rounds);
  };
}
