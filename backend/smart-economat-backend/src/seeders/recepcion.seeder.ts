import { DataSource } from 'typeorm';
import { Recepcion } from 'src/modules/recepcion/recepcion.entity/recepcion.entity';
import { RecepcionPedido } from 'src/modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { RecepcionProducto } from 'src/modules/recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { Pedido } from 'src/modules/pedidos/pedido.entity/pedido.entity';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');

  const recepcionRepo = dataSource.getRepository(Recepcion);
  const recepcionPedidoRepo = dataSource.getRepository(RecepcionPedido);
  const recepcionProductoRepo = dataSource.getRepository(RecepcionProducto);
  const pedidoRepo = dataSource.getRepository(Pedido);

  const pedidos = await pedidoRepo.find({ relations: ['productos'] });
  if (!pedidos.length) {
    console.log('No se encontraron pedidos, saltando seeder de recepciones.');
    return;
  }

  for (const pedido of pedidos) {
    const recepcion = recepcionRepo.create({
      usuario: faker.string.uuid(),
      observaciones: faker.lorem.sentence(),
      fechaRecepcion: faker.date.recent(),
    });
    await recepcionRepo.save(recepcion);

    const recepcionPedido = recepcionPedidoRepo.create({
      recepcion,
      pedido,
    });
    await recepcionPedidoRepo.save(recepcionPedido);

    if (pedido.productos && pedido.productos.length > 0) {
      const productosRecepcion: RecepcionProducto[] = [];
      const numProductosARecibir = faker.number.int({
        min: 1,
        max: pedido.productos.length,
      });
      const productosSeleccionados = faker.helpers.arrayElements(
        pedido.productos,
        numProductosARecibir
      );

      for (const pedidoProducto of productosSeleccionados) {
        const recepcionProducto = recepcionProductoRepo.create({
          cantidadRecibida: faker.number.int({
            min: 1,
            max: pedidoProducto.cantidad,
          }),
          observaciones: faker.lorem.sentence(),
          recepcion,
          pedidoProducto,
        });
        productosRecepcion.push(recepcionProducto);
      }
      await recepcionProductoRepo.save(productosRecepcion);
    }
  }
};
