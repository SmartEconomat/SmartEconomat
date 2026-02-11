import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { Seeder } from './interfaces/seeder.interface';

dotenv.config({ path: join(__dirname, '../../../../.env') });

import { dbConfig } from '../config/database.config';

const isDocker = existsSync('/.dockerenv');
const host = isDocker
  ? (dbConfig as any).host
  : process.env.POSTGRES_HOST_URL || 'localhost';

export const dataSource = new DataSource({
  ...dbConfig,
  host,
  dropSchema: true,
} as any);

async function runAllSeeders() {
  const seedersInOrder = [
    'usuario.seeder.ts',
    'proveedor.seeder.ts',
    'producto.seeder.ts',
    'inventario.seeder.ts',
    'pedido.seeder.ts',
    'recepcion.seeder.ts',
    'albaran.seeder.ts',
    'historial-pedido.seeder.ts',
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

  if (!filePath) throw new Error(`Seeder no encontrado: ${name}`);

  const seeder: Seeder = require(join(__dirname, filePath));
  if (typeof seeder.runSeeder !== 'function') {
    throw new Error(`No se encontró runSeeder en ${filePath}`);
  }

  console.log(`Ejecutando seeder ${filePath}...`);
  await seeder.runSeeder(dataSource);
}

void (async () => {
  try {
    await dataSource.initialize();
    const [, , arg] = process.argv;

    if (!arg || arg === 'all') {
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
