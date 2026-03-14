/**
 * @file bcrypt-mock.ts
 * @description Optimización de bcrypt para tests.
 *
 * Problema:
 * bcrypt con 10 rounds (default) tarda ~100ms por hash
 * En tests con muchos usuarios, esto suma SEGUNDOS
 *
 * Solución:
 * Reducir a 1 round en tests: < 1ms por hash
 *
 * IMPORTANTE: Esto solo debe usarse en tests, NUNCA en producción.
 *
 * @author SmartEconomat Team
 */

/**
 * Aplica mock de bcrypt para reducir rounds a 1 en tests.
 * Esta optimización es segura porque:
 * - Solo afecta el entorno de test
 * - La lógica de negocio sigue siendo la misma
 * - Los tests siguen validando el comportamiento correcto
 * - Se reducen DRÁSTICAMENTE los tiempos de test
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
