import { DataSource } from 'typeorm';
import {
  Pedido,
  EstadoPedido,
} from '../modules/pedidos/pedido.entity/pedido.entity';
import { PedidoProducto } from '../modules/pedidos/pedido-producto.entity/pedido-producto.entity';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { ProductoProveedor } from '../modules/productos/producto-proveedor.entity/producto-proveedor.entity';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const pedidoRepo = dataSource.getRepository(Pedido);
  const pedidoProductoRepo = dataSource.getRepository(PedidoProducto);
  const usuarioRepo = dataSource.getRepository(Usuario);
  const productoProveedorRepo = dataSource.getRepository(ProductoProveedor);

  const usuarios = await usuarioRepo.find();
  const productosProv = await productoProveedorRepo.find();

  if (usuarios.length === 0)
    throw new Error('No hay usuarios en la base de datos');
  if (productosProv.length === 0)
    throw new Error('No hay productos con proveedor');

  // Limpieza de tablas para evitar duplicados en pruebas
  await dataSource.query(
    `TRUNCATE TABLE "pedido_producto", "pedido" RESTART IDENTITY CASCADE;`
  );

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
      // Usamos el precio del proveedor o generamos uno si es null
      const precioUnitario =
        pp.precioUnitario ||
        parseFloat(faker.commerce.price({ min: 10, max: 500 }));

      acumuladoTotal += precioUnitario * cantidad;

      detallesPedido.push(
        pedidoProductoRepo.create({
          pedido: pedidoGuardado,
          productoProveedor: pp,
          cantidad: cantidad,
          // Asegúrate de que el nombre sea precioUnitario o precio_unitario según tu entidad
          precio_unitario: precioUnitario,
          observaciones: faker.datatype.boolean(0.3)
            ? faker.lorem.sentence()
            : undefined,
        })
      );
    }

    await pedidoProductoRepo.save(detallesPedido);

    // Actualizamos el coste total del pedido con la suma de sus productos
    pedidoGuardado.costeTotal = parseFloat(acumuladoTotal.toFixed(2));
    await pedidoRepo.save(pedidoGuardado);
  }

  console.log('✅ Seeder de pedidos y detalles completado con éxito.');
};
