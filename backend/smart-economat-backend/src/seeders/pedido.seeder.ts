import { DataSource } from 'typeorm';
import {
  Pedido,
  EstadoPedido,
} from '../modules/pedido/pedido.entity/pedido.entity';
import { PedidoProducto } from '../modules/pedido/pedido-producto.entity/pedido-producto.entity';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { ProductoProveedor } from '../modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { SEEDER_MESSAGES } from './constants/messages';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const pedidoRepo = dataSource.getRepository(Pedido);
  const pedidoProductoRepo = dataSource.getRepository(PedidoProducto);
  const usuarioRepo = dataSource.getRepository(Usuario);
  const productoProveedorRepo = dataSource.getRepository(ProductoProveedor);

  const usuarios = await usuarioRepo.find();
  const productosProv = await productoProveedorRepo.find();

  if (usuarios.length === 0) {
    throw new Error(SEEDER_MESSAGES.errors.NO_USUARIOS);
  }
  if (productosProv.length === 0) {
    throw new Error(SEEDER_MESSAGES.errors.NO_PRODUCTOS_PROVEEDOR);
  }

  for (let i = 0; i < 8; i++) {
    const pedido = pedidoRepo.create({
      usuario: faker.helpers.arrayElement(usuarios),
      fechaPedido: faker.date.recent({ days: 7 }),
      fechaEntrega: faker.date.soon({ days: 14 }),
      estado: faker.helpers.arrayElement(Object.values(EstadoPedido)),
      costeTotal: 0,
    });

    const pedidoGuardado = await pedidoRepo.save(pedido);

    const numItems = faker.number.int({ min: 1, max: 5 });
    const itemsSeleccionados = faker.helpers.arrayElements(
      productosProv,
      numItems
    );

    let acumuladoTotal = 0;
    const detallesPedido: PedidoProducto[] = [];

    for (const pp of itemsSeleccionados) {
      const cantidad = faker.number.int({ min: 1, max: 10 });
      const precioUnitario =
        pp.precioUnitario ||
        parseFloat(faker.commerce.price({ min: 10, max: 500 }));

      acumuladoTotal += precioUnitario * cantidad;

      detallesPedido.push(
        pedidoProductoRepo.create({
          pedido: pedidoGuardado,
          productoProveedor: pp,
          cantidad: cantidad,
          precioUnitario: precioUnitario,
          observaciones: faker.datatype.boolean(0.3)
            ? faker.lorem.sentence()
            : undefined,
        })
      );
    }

    await pedidoProductoRepo.save(detallesPedido);

    pedidoGuardado.costeTotal = parseFloat(acumuladoTotal.toFixed(2));
    await pedidoRepo.save(pedidoGuardado);
  }

  console.log('✅ Seeder de pedidos y detalles completado con éxito.');
};
