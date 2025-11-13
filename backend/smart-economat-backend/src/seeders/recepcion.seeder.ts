import { DataSource } from 'typeorm';
import { Recepcion } from 'src/modules/recepcion/recepcion.entity/recepcion.entity';
import { RecepcionPedido } from 'src/modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { RecepcionProducto } from 'src/modules/recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { PedidoProducto } from 'src/modules/pedidos/pedido-producto.entity/pedido-producto.entity';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');

  const recepcionRepo = dataSource.getRepository(Recepcion);
  const recepcionPedidoRepo = dataSource.getRepository(RecepcionPedido);
  const recepcionProductoRepo = dataSource.getRepository(RecepcionProducto);
  const pedidoProductoRepo = dataSource.getRepository(PedidoProducto);

  const pedidos = await recepcionPedidoRepo.find({
    relations: ['pedido'],
  });

  if (!pedidos.length) return;

  const allPedidoProductos = await pedidoProductoRepo.find();

  if (!allPedidoProductos.length) return;

  for (let i = 0; i < 5; i++) {
    const recepcion = recepcionRepo.create({
      usuario: faker.string.uuid(),
      observaciones: faker.commerce.productDescription(),
      fechaRecepcion: faker.date.recent(),
    });
    await recepcionRepo.save(recepcion);

    const pedidoRandom = faker.helpers.arrayElement(pedidos);

    const existeRelacion = await recepcionPedidoRepo.findOne({
      where: {
        recepcion,
        pedido: pedidoRandom.pedido || pedidoRandom,
      },
      relations: ['recepcion', 'pedido'],
    });

    if (!existeRelacion) {
      const nuevaRelacion = recepcionPedidoRepo.create({
        recepcion,
        pedido: pedidoRandom.pedido || pedidoRandom,
      });
      await recepcionPedidoRepo.save(nuevaRelacion);
    }

    const productos: RecepcionProducto[] = [];
    for (let j = 0; j < 3; j++) {
      const pedidoProductoRandom =
        faker.helpers.arrayElement(allPedidoProductos);

      const existeProducto = await recepcionProductoRepo.findOne({
        where: {
          recepcion,
          pedidoProducto: pedidoProductoRandom,
        },
        relations: ['recepcion', 'pedidoProducto'],
      });

      if (!existeProducto) {
        const prod = recepcionProductoRepo.create({
          cantidadRecibida: faker.number.int({ min: 1, max: 100 }),
          observaciones: faker.commerce.productDescription(),
          recepcion,
          pedidoProducto: pedidoProductoRandom,
        });
        productos.push(prod);
      }
    }

    if (productos.length) {
      await recepcionProductoRepo.save(productos);
    }
  }
};
