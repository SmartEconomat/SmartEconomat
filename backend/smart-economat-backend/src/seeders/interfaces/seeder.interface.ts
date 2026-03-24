import { SeedContext } from '../seed-context';

export interface Seeder {
  runSeeder: (context: SeedContext) => Promise<void>;
}
