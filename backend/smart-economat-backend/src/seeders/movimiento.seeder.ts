import { SeedContext } from './seed-context';
import { Movimiento } from '../modules/movimiento/movimiento.entity/movimiento.entity';
import {
  TipoMovimiento,
  TIPOS_DISPONIBLES,
} from '../modules/movimiento/enums/movimiento.enums';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { Producto } from '../modules/producto/producto.entity/producto.entity';
import { Pedido } from '../modules/pedido/pedido.entity/pedido.entity';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';

const NUM_MOVIMIENTOS = process.env.NODE_ENV === 'test' ? 5 : 50;

import { randomUUID } from 'node:crypto';
import { faker } from '@faker-js/faker';

export const runSeeder = async (context: SeedContext) => {
  const dataSource = context.getDataSource();
  const movimientoRepo = dataSource.getRepository(Movimiento);
  const usuarioRepo = dataSource.getRepository(Usuario);
  const productoRepo = dataSource.getRepository(Producto);
  const pedidoRepo = dataSource.getRepository(Pedido);

  const usuarios = await usuarioRepo.find();
  const productos = await productoRepo.find();
  const pedidos = await pedidoRepo.find();

  const movimientos: Movimiento[] = [];

  const entidades = ['PRODUCTO', 'PEDIDO', 'AJUSTE'] as const;

  for (let i = 0; i < NUM_MOVIMIENTOS; i++) {
    const entidadSeleccionada = faker.helpers.arrayElement(entidades);
    let entidadId: string = randomUUID();

    if (entidadSeleccionada === 'PRODUCTO' && productos.length > 0) {
      entidadId = faker.helpers.arrayElement(productos).id;
    } else if (entidadSeleccionada === 'PEDIDO' && pedidos.length > 0) {
      entidadId = faker.helpers.arrayElement(pedidos).id;
    }

    const movimiento = movimientoRepo.create({
      tipo: faker.helpers.arrayElement(TIPOS_DISPONIBLES) as TipoMovimiento,
      cantidad: faker.number.int({ min: 1, max: 100 }),
      descripcion: faker.datatype.boolean({ probability: 0.7 })
        ? faker.lorem.sentence()
        : undefined,
      entidad: entidadSeleccionada,
      entidadId: entidadId as any,
      usuario: faker.helpers.arrayElement(usuarios),
    });

    movimientos.push(movimiento);
  }

  await movimientoRepo.save(movimientos);
  console.log(SeederI18nHelper.getSeederSuccess('movimientos'));
};
