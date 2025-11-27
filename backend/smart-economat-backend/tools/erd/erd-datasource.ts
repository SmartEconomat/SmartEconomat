import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

import { newDb } from 'pg-mem';

const db = newDb();
db.public.registerFunction({
  name: 'current_database',
  implementation: () => 'test',
});
db.public.registerFunction({
  name: 'version',
  implementation: () => 'PostgreSQL 14.0',
});

export const dataSource = db.adapters.createTypeormDataSource({
  type: 'postgres',
  entities: [join(process.cwd(), 'src/**/*.entity.ts')],
  synchronize: false,
});
