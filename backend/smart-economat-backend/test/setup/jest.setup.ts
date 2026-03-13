import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { mockBcryptForTests } from './bcrypt-mock';
import { initPgMem } from './pg-mem';
import { seedTestDatabase, restoreToSeedState } from './seed-test-database';
import { getTestApp } from './test-app';
import {
  getFileSnapshot,
  setFileSnapshot,
  restoreSnapshot,
  clearFileSnapshot,
} from './pg-mem';
import { useContainer } from 'class-validator';

/**
 * @file jest.setup.ts
 * @description Configuración global de Jest ejecutada en cada worker.
 *
 * Este archivo se ejecuta UNA VEZ por worker de Jest antes de todos los tests.
 * Implementa la estrategia de testing de alta velocidad:
 *
 * 1. Inicializa pg-mem (PostgreSQL en memoria)
 * 2. Mockea bcrypt para 1 round (100x más rápido)
 * 3. Ejecuta seeders una sola vez
 * 4. Crea snapshot del estado seed
 * 5. Inicializa app NestJS una sola vez
 * 6. Configura hooks de Jest para snapshot/restore
 *
 * Cada test ejecuta en milisegundos porque:
 * - No conecta a PostgreSQL real
 * - No ejecuta migraciones
 * - No ejecuta seeders
 * - No inicializa NestJS
 * - Solo restaura snapshot (instantáneo)
 *
 * @author SmartEconomat Team
 */

// ============================================================================
// 1. CARGAR VARIABLES DE ENTORNO
// ============================================================================
const envPaths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '.env.test'),
  path.join(process.cwd(), '../../.env'),
  path.join(process.cwd(), '../../.env.dev'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    // Silenciar en tests para output limpio
    // console.log(`📄 Variables de entorno cargadas desde: ${envPath}`);
    break;
  }
}

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.DB_SYNC = 'false'; // TypeORM no debe syncronizar, pg-mem lo maneja
process.env.LOCAL_STORAGE_PATH =
  process.env.LOCAL_STORAGE_PATH || './uploads_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-mock';
process.env.JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
process.env.OFF_API_ENABLED = 'false'; // Deshabilitar APIs externas en tests

// ============================================================================
// 2. OPTIMIZAR BCRYPT
// ============================================================================
mockBcryptForTests();

// ============================================================================
// 3. INICIALIZAR PG-MEM
// ============================================================================
initPgMem();

// ============================================================================
// 4. PATCH DE TYPEORM PARA USAR PG-MEM
// ============================================================================
const g = global as any;
const { PlatformTools } = require('typeorm/platform/PlatformTools');
const originalLoad = PlatformTools.load.bind(PlatformTools);
const originalDescribe = global.describe;

PlatformTools.load = function (name: string) {
  if (name === 'pg') {
    // Redirigir TypeORM a usar el adaptador pg de pg-mem
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

// ============================================================================
// 5. CONFIGURAR TIMEOUT DE JEST
// ============================================================================
// Timeout generoso para el primer test (que ejecuta seeders y crea app)
// Los tests subsecuentes serán mucho más rápidos
jest.setTimeout(60000);

// Silenciar log final
// console.log('\n✅ jest.setup.ts cargado correctamente\n');

// ============================================================================
// 6. HOOKS DE JEST - INICIALIZACIÓN GLOBAL POR WORKER
// ============================================================================

/**
 * beforeAll global - se ejecuta UNA VEZ antes de todos los tests del worker.
 *
 * Responsabilidades:
 * 1. Ejecutar seeders (si es la primera vez)
 * 2. Crear snapshot de seeders
 * 3. Inicializar app NestJS
 */
beforeAll(async () => {
  // Ejecutar seeders y crear snapshot (solo primera vez)
  await seedTestDatabase();

  // Inicializar aplicación NestJS (solo primera vez)
  if (!g.__TEST_APP__) {
    const { AppModule } = require('../../src/app.module');
    const app = await getTestApp({ silent: false });
    useContainer(app.select(AppModule), { fallbackOnErrors: true });
  }

  // Restaurar al estado seed limpio antes de cada archivo de test
  restoreToSeedState();

  // Reset del file snapshot (se capturará en el primer beforeEach del archivo)
  clearFileSnapshot();
}, 120000); // 2 minutos de timeout para la inicialización

// ============================================================================
// 7. HOOKS DE JEST - AISLAMIENTO POR TEST
// ============================================================================

/**
 * beforeEach global - se ejecuta antes de CADA test.
 *
 * Estrategia de snapshots en dos niveles:
 *
 * Nivel 1: SEED_SNAPSHOT
 *   - Estado post-seeders (datos iniciales)
 *   - Se restaura en beforeAll de cada archivo de test
 *
 * Nivel 2: FILE_SNAPSHOT
 *   - Estado post-beforeAll del archivo de test
 *   - Incluye datos de setup específicos del archivo (ej: login, crear recursos)
 *   - Se captura en el PRIMER beforeEach del archivo
 *   - Se restaura en CADA beforeEach subsecuente
 *
 * Esto permite que cada archivo de test tenga su propio setup
 * sin afectar otros archivos, y que cada test individual
 * empiece con el estado consistente del archivo.
 */
beforeEach(() => {
  const fileSnapshot = getFileSnapshot();

  if (!fileSnapshot) {
    // Primer test del archivo: capturar snapshot post-beforeAll
    const newSnapshot = g.__PG_MEM_DB__.backup();
    setFileSnapshot(newSnapshot);
    // Silenciar: console.log('📸 File snapshot capturado');
  } else {
    // Tests subsecuentes: restaurar snapshot
    restoreSnapshot(fileSnapshot);
  }
});

/**
 * afterEach global - se ejecuta después de CADA test.
 *
 * Aunque ya usamos beforeEach con restore, este hook está aquí
 * por si se necesita limpieza adicional en el futuro.
 *
 * Actualmente, el restore en beforeEach es suficiente porque:
 * - Revierte TODOS los cambios de base de datos
 * - No hay efectos secundarios que limpiar
 */
afterEach(() => {
  // La limpieza principal se hace en beforeEach con restore
  // Este hook está reservado para limpieza adicional si se necesita
});

// ============================================================================
// 8. UTILIDADES GLOBALES PARA TESTS
// ============================================================================

/**
 * Información de compatibilidad para tests multi-worker:
 *
 * - Cada worker de Jest es un proceso Node.js independiente
 * - Cada worker tiene su propio:
 *   * pg-mem database
 *   * seeders ejecutados
 *   * app NestJS
 *   * snapshots
 * - No hay estado compartido entre workers
 * - Esto es CORRECTO y ESPERADO
 * - Permite paralelización segura de tests
 */

// Silenciar: console.log('\n✅ jest.setup.ts cargado correctamente\n');
