import { runNamedHttpSeeder } from './http-seed.catalog';

type HttpSeedContext = Parameters<typeof runNamedHttpSeeder>[1];

export const runSeeder = async (context: HttpSeedContext) => {
  await runNamedHttpSeeder('usuario', context);
};
