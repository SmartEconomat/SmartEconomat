import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { readdirSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { Seeder } from './interfaces/seeder.interface';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';

dotenv.config({ path: join(__dirname, '../../../../.env') });

if (process.env.NODE_ENV === 'production') {
  console.error(SeederI18nHelper.getSeederMessage('production_error'));
  process.exit(1);
}

import { dbConfig } from '../config/database.config';

export const dataSource = new DataSource({
  ...dbConfig,
  synchronize: process.env.NODE_ENV === 'test',
  dropSchema: process.argv.includes('reset'),
});

async function runAllSeeders() {
  const seedersInOrder = [
    'roles-permisos.seeder.ts',
    'usuario.seeder.ts',
    'proveedor.seeder.ts',
    'producto.seeder.ts',
    'inventario.seeder.ts',
    'pedido.seeder.ts',
    'recepcion.seeder.ts',
    'albaran.seeder.ts',
    'historial-precio.seeder.ts',
    'incidencia.seeder.ts',
    'movimiento.seeder.ts',
    'receta.seeder.ts',
  ];

  for (const file of seedersInOrder) {
    const seederPath = join(__dirname, file);
    const seeder: Seeder = require(seederPath);
    if (typeof seeder.runSeeder === 'function') {
      console.log(SeederI18nHelper.getSeederMessage('running', { file }));
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
      await dataSource.initialize();
      const [, , arg] = process.argv;

      if (!arg || arg === 'all' || arg === 'reset') {
        await runAllSeeders();
      } else {
        await runSeederByName(arg);
      }

      await dataSource.destroy();
      console.log(SeederI18nHelper.getSeederMessage('completed'));
    } catch (err) {
      console.error(SeederI18nHelper.getSeederMessage('error_running'), err);
      process.exit(1);
    }
  })();
}
