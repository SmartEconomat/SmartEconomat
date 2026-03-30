import 'reflect-metadata';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';
import { Seeder } from './interfaces/seeder.interface';
import { SeedContext, SeedContextConfig } from './seed-context';

if (process.env.NODE_ENV === 'production') {
  console.error('No se permite ejecutar seeders en producción');
  process.exit(1);
}

const seedersInOrder = [
  'roles-permisos.seeder',
  'usuario.seeder',
  'proveedor.seeder',
  'producto.seeder',
  'inventario.seeder',
  'pedido.seeder',
  'recepcion.seeder',
  'albaran.seeder',
  'historial-precio.seeder',
  'incidencia.seeder',
  'receta.seeder',
  'preparacion.seeder',
  'merma.seeder',
  'profesor-alumno.seeder',
  'archivo.seeder',
  'export.seeder',
  'produccion.seeder',
  'movimiento.seeder',
  'alertas.seeder',
];

export const dataSource = {
  isInitialized: false,
  initialize: async () => {},
  destroy: async () => {},
} as any;

async function initializeHttpSeedContext(
  config: SeedContextConfig = {}
): Promise<SeedContext> {
  const context = new SeedContext(config);

  await context.ensureDockerInfra();
  await context.waitForBackend();
  await context.login();

  return context;
}

async function runSeedersWithContext(
  context: SeedContext,
  options?: { continueOnError?: boolean }
): Promise<void> {
  const continueOnError = options?.continueOnError ?? false;

  for (const name of seedersInOrder) {
    const fileTs = `${name}.ts`;
    const fileJs = `${name}.js`;
    const dirFiles = readdirSync(__dirname);
    const filePath = dirFiles.includes(fileTs)
      ? fileTs
      : dirFiles.includes(fileJs)
        ? fileJs
        : null;

    if (!filePath) {
      console.warn(`Seeder file not found for: ${name}`);
      continue;
    }

    const seederPath = join(__dirname, filePath);
    const seeder: Seeder = require(seederPath);
    if (typeof seeder.runSeeder === 'function') {
      console.log(
        SeederI18nHelper.getSeederMessage('running', { file: filePath })
      );
      try {
        await seeder.runSeeder(context);
      } catch (error) {
        if (!continueOnError) {
          throw error;
        }
        console.warn(
          `[seed] Seeder ${filePath} falló y se omite en modo tolerante: ${String(
            error instanceof Error ? error.message : error
          )}`
        );
      }
    }
  }
}

async function runAllSeeders(): Promise<void> {
  const context = await initializeHttpSeedContext();

  try {
    await runSeedersWithContext(context);
  } finally {
    await context.close();
  }
}

async function createSeedContext(
  config: SeedContextConfig = {}
): Promise<SeedContext> {
  return initializeHttpSeedContext(config);
}

async function runSeederByName(name: string): Promise<void> {
  const context = await initializeHttpSeedContext();

  try {
    const fileTs = `${name}.seeder.ts`;
    const fileJs = `${name}.seeder.js`;
    const dirFiles = readdirSync(__dirname);
    const filePath = dirFiles.includes(fileTs)
      ? fileTs
      : dirFiles.includes(fileJs)
        ? fileJs
        : null;

    if (!filePath) {
      throw new Error(
        `${SeederI18nHelper.getError('SEEDER_NOT_FOUND')}: ${name}`
      );
    }

    const seeder: Seeder = require(join(__dirname, filePath));
    if (typeof seeder.runSeeder !== 'function') {
      throw new Error(
        `${SeederI18nHelper.getError('RUN_SEEDER_NOT_FOUND')} ${filePath}`
      );
    }

    console.log(
      SeederI18nHelper.getSeederMessage('running', { file: filePath })
    );
    await seeder.runSeeder(context);
  } finally {
    await context.close();
  }
}

export {
  runAllSeeders,
  runSeederByName,
  createSeedContext,
  runSeedersWithContext,
};

if (require.main === module) {
  void (async () => {
    try {
      console.log('Iniciando seeders HTTP en entorno de desarrollo...');
      const [, , arg] = process.argv;

      if (!arg || arg === 'all' || arg === 'reset') {
        await runAllSeeders();
      } else {
        await runSeederByName(arg);
      }

      console.log('Seeders HTTP ejecutados correctamente.');
    } catch (err) {
      console.error('Error al ejecutar seeders HTTP:', err);
      process.exit(1);
    }
  })();
}
