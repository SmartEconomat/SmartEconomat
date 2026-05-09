import { SeedContext } from '../seed-context';

/** Contrato de tipos público (Seeder). Contexto: smart-economat-backend (Nest). */
export interface Seeder {
  runSeeder: (context: SeedContext) => Promise<void>;
}
