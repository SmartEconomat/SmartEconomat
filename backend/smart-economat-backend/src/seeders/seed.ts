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
});

console.log(process.env.POSTGRES_PASSWORD);

async function runAllSeeders() {
  const seedersInOrder = ['producto.seeder.ts', 'pedido.seeder.ts'];

  for (const file of seedersInOrder) {
    const seeder: Seeder = require(join(__dirname, file)) as Seeder;
    if (typeof seeder.runSeeder === 'function') {
      console.log(`Ejecutando seeder ${file}...`);
      await seeder.runSeeder(dataSource);
    }
  }
}

async function runSeederByName(name: string) {
  const fileTs = `${name}.seeder.ts`;
  const fileJs = `${name}.seeder.js`;
  let filePath = '';
  const dirFiles = readdirSync(__dirname);
  if (dirFiles.includes(fileTs)) {
    filePath = fileTs;
  } else if (dirFiles.includes(fileJs)) {
    filePath = fileJs;
  } else {
    throw new Error(`Seeder no encontrado: ${name}`);
  }
  const seeder: Seeder = require(join(__dirname, filePath)) as Seeder;
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
