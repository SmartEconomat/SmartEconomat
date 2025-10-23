import { DataSource } from 'typeorm';

export interface Seeder {
  runSeeder: (dataSource: DataSource) => Promise<void>;
}
