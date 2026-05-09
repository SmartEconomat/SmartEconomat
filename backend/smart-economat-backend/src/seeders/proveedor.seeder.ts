import { SeedContext } from './seed-context';
import { runNamedHttpSeeder } from './http-seed.catalog';

/**
 * Expone "runSeeder" en smart-economat-backend (Nest).
 * @undefined {SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export const runSeeder = async (context: SeedContext) => {
  await runNamedHttpSeeder('proveedor', context);
};
