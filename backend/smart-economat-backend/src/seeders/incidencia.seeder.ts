/**
 * @module seeders/incidencia
 * HTTP seeder that populates incidence records via the REST API.
 */
import { SeedContext } from './seed-context';
import { runNamedHttpSeeder } from './http-seed.catalog';

/**
 * Seeds incidencia data through the named HTTP seeder catalog.
 * @param {SeedContext} context - The active seed context providing HTTP helpers and state.
 * @returns {Promise<void>}
 * @example
 * await runSeeder(context);
 */
export const runSeeder = async (context: SeedContext) => {
  await runNamedHttpSeeder('incidencia', context);
};
