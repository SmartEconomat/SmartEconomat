/**
 * @module seeders/usuario
 * HTTP seeder that creates user accounts via the REST API.
 */
import { runNamedHttpSeeder } from './http-seed.catalog';

type HttpSeedContext = Parameters<typeof runNamedHttpSeeder>[1];

/**
 * Seeds usuario (user account) data through the named HTTP seeder catalog.
 * @param {HttpSeedContext} context - The active seed context providing HTTP helpers and state.
 * @returns {Promise<void>}
 * @example
 * await runSeeder(context);
 */
export const runSeeder = async (context: HttpSeedContext) => {
  await runNamedHttpSeeder('usuario', context);
};
