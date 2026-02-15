import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { readdirSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { Seeder } from './interfaces/seeder.interface';
import { SEEDER_MESSAGES } from './constants/messages';

dotenv.config({ path: join(__dirname, '../../../../.env') });

if (process.env.NODE_ENV === 'production') {
  console.error(
    '⛔️  ERROR: No puedes ejecutar seeders en entorno de producción!'
  );
  process.exit(1);
}

import { dbConfig } from '../config/database.config';

export const dataSource = new DataSource({
  ...dbConfig,
  synchronize: false,
  dropSchema: process.argv.includes('reset'),
});

async function runAllSeeders() {
  const seedersInOrder = [
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
  ];

  for (const file of seedersInOrder) {
    const seederPath = join(__dirname, file);
    const seeder: Seeder = require(seederPath);
    if (typeof seeder.runSeeder === 'function') {
      console.log(`Ejecutando seeder ${file}...`);
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
    throw new Error(`${SEEDER_MESSAGES.errors.SEEDER_NOT_FOUND}: ${name}`);
  }

  const seeder: Seeder = require(join(__dirname, filePath));
  if (typeof seeder.runSeeder !== 'function') {
    throw new Error(
      `${SEEDER_MESSAGES.errors.RUN_SEEDER_NOT_FOUND} ${filePath}`
    );
  }

  console.log(`Ejecutando seeder ${filePath}...`);
  await seeder.runSeeder(dataSource);
}

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
    console.log('Seeders ejecutados correctamente');
  } catch (err) {
    console.error('Error al ejecutar seeders:', err);
    process.exit(1);
  }
})();
