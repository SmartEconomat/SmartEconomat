import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { mockBcryptForTests } from './bcrypt-mock';
import { initPgMem } from './pg-mem';
import {
  initTestDataSource,
  runTestSeeders,
  restoreToSeedState,
} from './seed-test-database';
import { getTestApp } from './test-app';
import {
  getFileSnapshot,
  setFileSnapshot,
  restoreSnapshot,
  clearFileSnapshot,
} from './pg-mem';
import { useContainer } from 'class-validator';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

const envPaths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '.env.test'),
  path.join(process.cwd(), '../../.env'),
  path.join(process.cwd(), '../../.env.dev'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });

    break;
  }
}

process.env.NODE_ENV = 'test';
process.env.DB_SYNC = 'false';
process.env.LOCAL_STORAGE_PATH =
  process.env.LOCAL_STORAGE_PATH || './uploads_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-mock';
process.env.JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
process.env.OFF_API_ENABLED = 'false';

mockBcryptForTests();

initPgMem();

const g = global as any;
const { PlatformTools } = require('typeorm/platform/PlatformTools');
const originalLoad = PlatformTools.load.bind(PlatformTools);
const originalDescribe = global.describe;

PlatformTools.load = function (name: string) {
  if (name === 'pg') {
    return g.__PG_MEM_PG__;
  }
  return originalLoad(name);
};

function wrapDescribe(describeImpl: typeof describe): typeof describe {
  return ((name: string, fn?: jest.EmptyFunction) => {
    if (typeof fn !== 'function') {
      return describeImpl(name, fn as never);
    }

    return describeImpl(name, () => {
      const depth = g.__TEST_DESCRIBE_DEPTH__ || 0;
      const isTopLevelSuite = depth === 0;
      g.__TEST_DESCRIBE_DEPTH__ = depth + 1;

      if (isTopLevelSuite) {
        beforeAll(() => {
          restoreToSeedState();
          clearFileSnapshot();
        });
      }

      try {
        fn();
      } finally {
        g.__TEST_DESCRIBE_DEPTH__ = depth;
      }
    });
  }) as typeof describe;
}

global.describe = wrapDescribe(originalDescribe);
global.describe.only = wrapDescribe(originalDescribe.only);

jest.setTimeout(60000);

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
beforeAll(async () => {
  await initTestDataSource();

  if (!g.__TEST_APP__) {
    const { AppModule } = require('../../src/app.module');
    const app = await getTestApp({ silent: false });
    useContainer(app.select(AppModule), { fallbackOnErrors: true });
    g.__NEST_APP_FOR_SEED__ = app;
  }

  await runTestSeeders();

  restoreToSeedState();
  clearFileSnapshot();
}, 120000);

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
beforeEach(() => {
  const fileSnapshot = getFileSnapshot();

  if (!fileSnapshot) {
    const newSnapshot = g.__PG_MEM_DB__.backup();
    setFileSnapshot(newSnapshot);
  } else {
    restoreSnapshot(fileSnapshot);
  }
});

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
afterEach(() => {});

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
