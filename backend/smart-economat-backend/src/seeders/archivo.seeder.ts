import { SeedContext } from './seed-context';
import { runNamedHttpSeeder } from './http-seed.catalog';

export const runSeeder = async (context: SeedContext) => {
  await runNamedHttpSeeder('archivos', context);
};
