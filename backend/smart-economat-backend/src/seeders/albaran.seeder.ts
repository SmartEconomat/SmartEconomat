/**
 * Documentación en español.
 */
import { SeedContext } from './seed-context';
import { runNamedHttpSeeder } from './http-seed.catalog';

/**
 * Documentación en español.
 */
export const runSeeder = async (context: SeedContext) => {
  await runNamedHttpSeeder('albaran', context);
};
