import * as dotenv from 'dotenv';
import { join } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const envPath = join(__dirname, '../../../../../');
dotenv.config({ path: join(envPath, '.env') });

export const dataSource: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'smart_economat',
  synchronize: process.env.DB_SYNC === 'true',
  entities: [join(process.cwd(), 'dist/**/*.entity.{js,ts}')],
};
