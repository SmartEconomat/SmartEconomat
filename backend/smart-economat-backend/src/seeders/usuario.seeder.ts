/**
 * Documentación en español.
 */
import { runNamedHttpSeeder } from './http-seed.catalog';

type HttpSeedContext = Parameters<typeof runNamedHttpSeeder>[1];

/**
 * Documentación en español.
 */
export const runSeeder = async (context: HttpSeedContext) => {
  await runNamedHttpSeeder('usuario', context);
};
