/**
 * @module seeders/roles-permisos
 * HTTP seeder that creates role and permission seed data via the REST API.
 */
import { SeedContext } from './seed-context';
import { runNamedHttpSeeder } from './http-seed.catalog';

/**
 * Seeds roles and permissions through the named HTTP seeder catalog.
 * @param {SeedContext} context - The active seed context providing HTTP helpers and state.
 * @returns {Promise<void>}
 * @example
 * await runSeeder(context);
 */
export const runSeeder = async (context: SeedContext) => {
  await runNamedHttpSeeder('roles-permisos', context);
};
