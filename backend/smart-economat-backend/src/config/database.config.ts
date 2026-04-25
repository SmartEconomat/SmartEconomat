import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

import { existsSync } from 'fs';

const normalizedNodeEnv = String(process.env.NODE_ENV || '')
  .trim()
  .toLowerCase();

const envPaths =
  normalizedNodeEnv === 'production'
    ? [
        join(process.cwd(), '.env.prod'),
        join(process.cwd(), '../../.env.prod'),
        join(process.cwd(), '.env'),
        join(process.cwd(), '../../.env'),
        join(process.cwd(), '../../.env.dev'),
      ]
    : [
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

/**
 * @description Base TypeORM `DataSourceOptions` for the PostgreSQL connection.
 * Connection parameters are resolved from environment variables with sensible defaults.
 * In test environments, a fixed `pg-mem` host and `test` credentials are used.
 * Schema synchronisation (`synchronize`) is disabled in production and when running
 * migration CLI commands to protect against accidental data loss.
 */
export const dbConfig: DataSourceOptions = {
  type: 'postgres',
  host: isTestEnv ? 'pg-mem' : finalHost,
  port: isTestEnv ? 5432 : parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: isTestEnv ? 'test' : process.env.POSTGRES_USER || 'postgres',
  password: isTestEnv ? 'test' : process.env.POSTGRES_PASSWORD || 'postgres',
  database: isTestEnv ? 'test' : process.env.POSTGRES_DB || 'smart_economat',
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

/**
 * @description Standalone TypeORM `DataSource` instance used by the TypeORM CLI
 * (e.g. for running or reverting migrations outside the NestJS application context).
 * Instantiated from {@link dbConfig}.
 */
export const AppDataSource = new DataSource(dbConfig);

/**
 * @description TypeORM module options for use with `TypeOrmModule.forRoot()` in the
 * NestJS application. Extends {@link dbConfig} with `autoLoadEntities: true` so that
 * feature modules can register their entities via `TypeOrmModule.forFeature()`.
 */
export const typeOrmConfig: TypeOrmModuleOptions = {
  ...dbConfig,
  autoLoadEntities: true,
};
