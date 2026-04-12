import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

import { existsSync } from 'fs';

const envPaths = [
  join(process.cwd(), '.env'),
  join(process.cwd(), '../../.env'),
  join(process.cwd(), '../../.env.dev'),
];

for (const path of envPaths) {
  if (existsSync(path)) {
    dotenv.config({ path });

    if (process.env.NODE_ENV !== 'test') {
      console.log(`Loaded environment from ${path}`);
    }
    break;
  }
}

const isDocker = existsSync('/.dockerenv');
let dbHost = process.env.DB_HOST;
if (!isDocker && dbHost === 'db') {
  dbHost = 'localhost';
} else if (!dbHost) {
  dbHost = isDocker ? 'db' : 'localhost';
}
const finalHost = dbHost;

const isTestEnv = process.env.NODE_ENV === 'test';
const isProductionEnv = process.env.NODE_ENV === 'production';
const isMigrationCliCommand = process.argv.some((arg) =>
  /^migration:(run|revert|show)$/u.test(arg)
);
const synchronizeEnabled =
  process.env.DB_SYNC === 'true' && !isMigrationCliCommand && !isProductionEnv;

if (isProductionEnv && process.env.DB_SYNC === 'true') {
  console.warn(
    '[database.config] DB_SYNC=true ignorado en produccion por seguridad. Usa migraciones.'
  );
}

export const dbConfig: DataSourceOptions = {
  type: 'postgres',
  host: isTestEnv ? 'pg-mem' : finalHost,
  port: isTestEnv ? 5432 : parseInt(process.env.DB_PORT || '5432', 10),
  username: isTestEnv
    ? 'test'
    : process.env.DB_USERNAME || process.env.POSTGRES_USER || 'postgres',
  password: isTestEnv
    ? 'test'
    : process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'postgres',
  database: isTestEnv
    ? 'test'
    : process.env.DB_DATABASE || process.env.POSTGRES_DB || 'smart_economat',
  synchronize: synchronizeEnabled,
  logging: false,
  entities: [join(__dirname, '../**/*.entity.{ts,js}')],
  migrations: [join(__dirname, '../migrations/*.{ts,js}')],
  subscribers: [],
};

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  console.log('Database Config:', {
    ...dbConfig,
    password: '*****',
  });
}

export const AppDataSource = new DataSource(dbConfig);

export const typeOrmConfig: TypeOrmModuleOptions = {
  ...dbConfig,
  autoLoadEntities: true,
};
