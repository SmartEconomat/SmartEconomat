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
    console.log(`Loaded environment from ${path}`);
    break;
  }
}

const isDocker = existsSync('/.dockerenv');
const dbHost = process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost';
const finalHost = !isDocker && dbHost === 'db' ? 'localhost' : dbHost;

export const dbConfig: DataSourceOptions = {
  type: 'postgres',
  host: finalHost,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || process.env.POSTGRES_USER || 'postgres',
  password:
    process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'postgres',
  database:
    process.env.DB_DATABASE || process.env.POSTGRES_DB || 'smart_economat',
  synchronize:
    process.env.DB_SYNC === 'true' ||
    (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test'),
  logging:
    process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test',
  entities: [join(__dirname, '../**/*.entity.{ts,js}')],
  migrations: [join(__dirname, '../migrations/*.{ts,js}')],
  subscribers: [],
};

if (process.env.NODE_ENV !== 'production') {
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
