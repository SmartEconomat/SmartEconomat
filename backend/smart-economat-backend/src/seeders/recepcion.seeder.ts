import { DataSource } from 'typeorm';
import { Recepcion } from '../modules/recepcion/recepcion.entity/recepcion.entity';
import { RecepcionPedido } from '../modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { RecepcionProducto } from '../modules/recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { Pedido } from '../modules/pedido/pedido.entity/pedido.entity';
import { PedidoProducto } from '../modules/pedido/pedido-producto.entity/pedido-producto.entity';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const recepcionRepo = dataSource.getRepository(Recepcion);
  const recepcionPedidoRepo = dataSource.getRepository(RecepcionPedido);
  const recepcionProductoRepo = dataSource.getRepository(RecepcionProducto);
  const pedidoRepo = dataSource.getRepository(Pedido);
  const pedidoProductoRepo = dataSource.getRepository(PedidoProducto);

  const pedidos = await pedidoRepo.find({
    relations: ['usuario'],
  });

  if (!pedidos.length) {
    console.log('No se encontraron pedidos, saltando seeder de recepciones.');
    return;
  }

  for (const pedido of pedidos) {
    const pedidoProductos = await pedidoProductoRepo.find({
      where: { pedido: { id: pedido.id } },
      relations: ['productoProveedor', 'productoProveedor.producto'],
    });

    if (pedidoProductos.length === 0) continue;

    const recepcion = new Recepcion();
    const usuarioAleatorio = await dataSource
      .getRepository('Usuario')
      .findOne({ where: {} });
    recepcion.usuario = usuarioAleatorio?.id || faker.string.uuid();
    recepcion.fechaRecepcion = faker.date.recent({ days: 3 });
    recepcion.observaciones = faker.datatype.boolean(0.4)
      ? faker.lorem.sentence()
      : undefined;
    await recepcionRepo.save(recepcion);

    const rp = new RecepcionPedido();
    rp.recepcion = recepcion;
    rp.pedido = pedido;
    rp.fechaVinculacion = faker.date.recent();
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
      const cantidadMax = Math.max(1, Number(pp.cantidad));
      const recibida = faker.number.int({ min: 1, max: cantidadMax });

      const rpProd = new RecepcionProducto();
      rpProd.recepcion = recepcion;
      rpProd.pedidoProducto = pp;
      rpProd.cantidadRecibida = recibida;
      rpProd.observaciones = faker.datatype.boolean(0.3)
        ? faker.lorem.sentence()
        : undefined;
      rpProd.fechaRecepcion = faker.date.recent();

      recepcionesProd.push(rpProd);
    }

    if (recepcionesProd.length > 0) {
      await recepcionProductoRepo.save(recepcionesProd);
    }
  }

  console.log('Seeder de recepciones ejecutado correctamente.');
};
