import { DataSource } from 'typeorm';
import { Recepcion } from '../modules/recepcion/recepcion.entity/recepcion.entity';
import { RecepcionPedido } from '../modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { RecepcionProducto } from '../modules/recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { Pedido } from '../modules/pedido/pedido.entity/pedido.entity';
import { PedidoProducto } from '../modules/pedido/pedido-producto.entity/pedido-producto.entity';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const recepcionRepo = dataSource.getRepository(Recepcion);
  const recepcionPedidoRepo = dataSource.getRepository(RecepcionPedido);
  const recepcionProductoRepo = dataSource.getRepository(RecepcionProducto);
  const pedidoRepo = dataSource.getRepository(Pedido);
  const pedidoProductoRepo = dataSource.getRepository(PedidoProducto);
  const usuarioRepo = dataSource.getRepository(Usuario);

  const pedidos = await pedidoRepo.find();
  const usuarios = await usuarioRepo.find();

  if (pedidos.length === 0) {
    throw new Error(SeederI18nHelper.getError('NO_PEDIDOS'));
  }
  if (usuarios.length === 0) {
    throw new Error(SeederI18nHelper.getError('NO_USUARIOS'));
  }

  for (const pedido of pedidos) {
    const pedidoProductos = await pedidoProductoRepo.find({
      where: { pedido: { id: pedido.id } },
      relations: ['productoProveedor'],
    });

    if (pedidoProductos.length === 0) continue;

    const recepcion = recepcionRepo.create({
      usuario: faker.helpers.arrayElement(usuarios),
      fechaRecepcion: faker.date.recent({ days: 3 }),
      observaciones: faker.datatype.boolean(0.4)
        ? faker.lorem.sentence()
        : undefined,
    });
    const recepcionGuardada = await recepcionRepo.save(recepcion);

    const rp = recepcionPedidoRepo.create({
      recepcion: recepcionGuardada,
      pedido: pedido,
      fechaVinculacion: faker.date.recent(),
    });
    await recepcionPedidoRepo.save(rp);

    const numRecibir = faker.number.int({
      min: 1,
      max: pedidoProductos.length,
    });
    const seleccionados = faker.helpers.arrayElements(
      pedidoProductos,
      numRecibir
    );

    const recepcionesProd: RecepcionProducto[] = [];
    for (const pp of seleccionados) {
      const cantidadPedida = Number(pp.cantidad);
      const recibida = faker.number.int({
        min: 1,
        max: Math.floor(cantidadPedida),
      });

      recepcionesProd.push(
        recepcionProductoRepo.create({
          recepcion: recepcionGuardada,
          pedidoProducto: pp,
          cantidadRecibida: recibida,
          observaciones: faker.datatype.boolean(0.3)
            ? faker.lorem.sentence()
            : undefined,
          fechaRecepcion: faker.date.recent(),
        })
      );
    }

    if (recepcionesProd.length > 0) {
      await recepcionProductoRepo.save(recepcionesProd);
    }
  }

  console.log(SeederI18nHelper.getSeederSuccess('recepciones'));
};
