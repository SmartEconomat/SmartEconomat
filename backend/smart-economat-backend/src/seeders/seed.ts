import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { readdirSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { Seeder } from './interfaces/seeder.interface';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';

/* 
  dotenv.config({ path: join(__dirname, '../../../../.env.prod') }); 
  ⚠️ ADVERTENCIA: Esto solo debe usarse si entiendes perfectamente las implicaciones. 
  Nunca usar en producción real. 
  Solo habilitar en entornos de desarrollo controlados para pruebas específicas.
*/

dotenv.config({ path: join(__dirname, '../../../../.env') });
//dotenv.config({ path: join(__dirname, '../../../../.env.prod') });

if (process.env.NODE_ENV === 'production') {
  console.error('No se permite ejecutar seeders en producción');
  process.exit(1);
}

import { dbConfig } from '../config/database.config';

export const dataSource = new DataSource({
  ...dbConfig,
  entities: [join(__dirname, '../**/*.entity.{ts,js}')],
  migrations: [join(__dirname, '../migrations/*.{ts,js}')],
  synchronize:
    process.env.NODE_ENV === 'test' || process.argv.includes('reset'),
  dropSchema: process.argv.includes('reset'),
});

async function waitForDatabase(
  ds: typeof dataSource,
  retries = 5,
  delayMs = 3000
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await ds.initialize();
      return;
    } catch (err) {
      if (attempt >= retries) {
        throw err;
      }

      console.warn(
        `[seed] DB no disponible (intento ${attempt}/${retries}), reintentando en ${delayMs}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function runAllSeeders() {
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
    'movimiento.seeder',
    'receta.seeder',
    'merma.seeder',
  ];

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
      await seeder.runSeeder(dataSource);
    }
  }
}

async function runSeederByName(name: string) {
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

  console.log(SeederI18nHelper.getSeederMessage('running', { file: filePath }));
  await seeder.runSeeder(dataSource);
}

export { runAllSeeders, runSeederByName };

if (require.main === module) {
  void (async () => {
    try {
      console.log('Iniciando seeders en entorno de desarrollo...');
      await waitForDatabase(dataSource);
      const [, , arg] = process.argv;

      if (!arg || arg === 'all' || arg === 'reset') {
        await runAllSeeders();
      } else {
        await runSeederByName(arg);
      }

      await dataSource.destroy();
      console.log('Seeder ejecutado correctamente en desarrollo.');
    } catch (err) {
      console.error(
        'Error al ejecutar seeders: revisar usuario, password y base de datos de desarrollo',
        err
      );
      process.exit(1);
    }
  })();
}
