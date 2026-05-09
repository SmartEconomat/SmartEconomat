/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
import { SeedContext } from './seed-context';
import { runNamedHttpSeeder } from './http-seed.catalog';

/**
 * Ejecuta la lógica de run seeder dentro del flujo de la aplicación.
 *
 * @param context Parámetro de entrada para la operación.
 */
/**
 * Expone "runSeeder" en smart-economat-backend (Nest).
 * @undefined {SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export const runSeeder = async (context: SeedContext) => {
  await runNamedHttpSeeder('pedido', context);
};
