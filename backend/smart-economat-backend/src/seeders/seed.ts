import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { readdirSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { Seeder } from './interfaces/seeder.interface';

dotenv.config({ path: join(__dirname, '../../../../.env') });
const configService = new ConfigService();

export const dataSource = new DataSource({
  type: 'postgres',
  host: configService.get<string>('POSTGRES_HOST_URL'),
  port: configService.get<number>('POSTGRES_PORT'),
  username: configService.get<string>('POSTGRES_USER'),
  password: configService.get<string>('POSTGRES_PASSWORD'),
  database: configService.get<string>('POSTGRES_DB'),
  entities: [join(__dirname, '../**/*.entity.{ts,js}')],
  synchronize: configService.get<string>('DB_SYNC') === 'true',
  logging: false,
});

async function runAllSeeders() {
  const seedersInOrder = [
    'usuario.seeder.ts',
    'proveedor.seeder.ts',
    'producto.seeder.ts',
    'pedido.seeder.ts',
    'recepcion.seeder.ts',
    'albaran.seeder.ts',
    'movimiento.seeder.ts',
    'historial-pedido.seeder.ts',
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
