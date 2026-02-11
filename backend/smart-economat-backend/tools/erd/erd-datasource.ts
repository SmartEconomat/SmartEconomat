import * as dotenv from 'dotenv';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenv.config({ path: join(process.cwd(), '.env') });

const { newDb }: { newDb: () => any } = require('pg-mem');

interface PgMemPublic {
  registerFunction: (opts: { name: string; implementation: () => any }) => void;
}

interface PgMemAdapters {
  createTypeormDataSource: (options: DataSourceOptions) => DataSource;
}

interface PgMemDb {
  public: PgMemPublic;
  adapters: PgMemAdapters;
}

const db: PgMemDb = newDb() as unknown as PgMemDb;

db.public.registerFunction({
  name: 'current_database',
  implementation: () => 'test',
});

db.public.registerFunction({
  name: 'version',
  implementation: () => 'PostgreSQL 14.0',
});

export const dataSource: DataSource = db.adapters.createTypeormDataSource({
  type: 'postgres',
  entities: [join(process.cwd(), 'src/**/*.entity.ts')],
  synchronize: false,
});
