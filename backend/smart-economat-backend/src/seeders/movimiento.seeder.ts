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

  const movimientos: Movimiento[] = [];

  const entidades = ['PRODUCTO', 'PEDIDO', 'AJUSTE'] as const;

  for (let i = 0; i < NUM_MOVIMIENTOS; i++) {
    const entidadSeleccionada = faker.helpers.arrayElement(entidades);

    const movimiento = movimientoRepo.create({
      tipo: faker.helpers.arrayElement(TIPOS_DISPONIBLES) as TipoMovimiento,
      cantidad: faker.number.int({ min: 1, max: 100 }),
      descripcion: faker.datatype.boolean({ probability: 0.7 })
        ? faker.lorem.sentence()
        : null,
      fecha: faker.date.recent({ days: 30 }),
      entidad: entidadSeleccionada,
      entidadId: faker.string.uuid(),
      usuario: faker.helpers.arrayElement(usuarios),
    });

    movimientos.push(movimiento);
  }

  await movimientoRepo.save(movimientos);
};
