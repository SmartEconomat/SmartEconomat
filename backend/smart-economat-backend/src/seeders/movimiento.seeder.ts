/**
 * @module seeders/movimiento
 * HTTP seeder that populates stock movement audit records via the REST API.
 */
import { SeedContext } from './seed-context';
import { runNamedHttpSeeder } from './http-seed.catalog';

/**
 * Seeds movimiento (stock movement) data through the named HTTP seeder catalog.
 * @param {SeedContext} context - The active seed context providing HTTP helpers and state.
 * @returns {Promise<void>}
 * @example
 * await runSeeder(context);
 */
export const runSeeder = async (context: SeedContext) => {
  await runNamedHttpSeeder('movimientos', context);
};
