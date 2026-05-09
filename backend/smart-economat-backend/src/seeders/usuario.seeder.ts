/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
import { runNamedHttpSeeder } from './http-seed.catalog';

type HttpSeedContext = Parameters<typeof runNamedHttpSeeder>[1];

/**
 * Ejecuta la lógica de run seeder dentro del flujo de la aplicación.
 *
 * @param context Parámetro de entrada para la operación.
 */
/**
 * Expone "runSeeder" en smart-economat-backend (Nest).
 * @undefined {import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/seed-context").SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export const runSeeder = async (context: HttpSeedContext) => {
  await runNamedHttpSeeder('usuario', context);
};
