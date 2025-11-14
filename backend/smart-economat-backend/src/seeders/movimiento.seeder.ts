// src/seeders/movimiento.seeder.ts
import { DataSource } from 'typeorm';
import { Movimiento } from '../modules/movimiento/movimiento.entity/movimiento.entity';
import {
  TipoMovimiento,
  TIPOS_DISPONIBLES,
} from '../modules/movimiento/enums/movimiento.enums';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';

const NUM_MOVIMIENTOS = 50;

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const movimientoRepo = dataSource.getRepository(Movimiento);
  const usuarioRepo = dataSource.getRepository(Usuario);

  const usuarios = await usuarioRepo.find();
  if (usuarios.length === 0) {
    console.warn('No hay usuarios. Saltando seeder de movimientos.');
    return;
  }

  await dataSource.query(
    `TRUNCATE TABLE "movimiento" RESTART IDENTITY CASCADE;`
  );

  const movimientos: Movimiento[] = [];
  for (let i = 0; i < NUM_MOVIMIENTOS; i++) {
    const movimiento = movimientoRepo.create({
      tipo: faker.helpers.arrayElement(TIPOS_DISPONIBLES) as TipoMovimiento,
      cantidad: faker.number.int({ min: 1, max: 100 }),
      descripcion: faker.lorem.sentence(),
      fecha: faker.date.recent({ days: 30 }),
      usuario: faker.helpers.arrayElement(usuarios),
      inventario: faker.string.uuid(),
    });
    movimientos.push(movimiento);
  }

  await movimientoRepo.save(movimientos);
  console.log('Seeder de movimientos ejecutado correctamente.');
};
