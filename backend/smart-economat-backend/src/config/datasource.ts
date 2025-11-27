import * as dotenv from 'dotenv';
import { join } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

dotenv.config({ path: join(process.cwd(), '.env') });

export const dataSource: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'smart_economat',
  synchronize: process.env.DB_SYNC === 'true',
  entities: [join(process.cwd(), 'dist/**/*.entity.{js,ts}')],
};
