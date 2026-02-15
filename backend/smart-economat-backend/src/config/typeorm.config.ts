import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../../../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(
    process.env.DB_PORT || process.env.POSTGRES_PORT || '5433',
    10
  ),
  username: process.env.DB_USERNAME || process.env.POSTGRES_USER || 'postgres',
  password:
    process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'postgres',
  database:
    process.env.DB_DATABASE || process.env.POSTGRES_DB || 'smart_economat',
  synchronize: false,
  logging: true,
  entities: [join(__dirname, '../modules/**/*.entity.{ts,js}')],
  migrations: [join(__dirname, '../migrations/*.{ts,js}')],
});
