// src/seeders/pedido.seeder.ts
import { DataSource } from 'typeorm';
import { Pedido } from '../modules/pedidos/pedido.entity/pedido.entity';
import { PedidoProducto } from '../modules/pedidos/pedido-producto.entity/pedido-producto.entity';
import { EstadoPedido } from '../modules/pedidos/enums/estado-pedido.enum';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { ProductoProveedor } from '../modules/productos/producto-proveedor.entity/producto-proveedor.entity';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');

  const pedidoRepo = dataSource.getRepository(Pedido);
  const pedidoProductoRepo = dataSource.getRepository(PedidoProducto);
  const usuarioRepo = dataSource.getRepository(Usuario);
  const productoProveedorRepo = dataSource.getRepository(ProductoProveedor);

  const usuarios = await usuarioRepo.find();
  const productosProv = await productoProveedorRepo.find({
    relations: ['producto', 'proveedor'],
  });

  if (usuarios.length === 0) throw new Error('No hay usuarios');
  if (productosProv.length === 0)
    throw new Error('No hay productos con proveedor');

  await dataSource.query(`
  TRUNCATE TABLE 
      "pedido_productos",
      "pedido_producto_proveedor",
      "pedido" 
    RESTART IDENTITY CASCADE;
  `);

  const pedidos: Pedido[] = [];
  const pedidoProductos: PedidoProducto[] = [];

  for (let i = 0; i < 8; i++) {
    const numItems = faker.number.int({ min: 1, max: 5 });
    const items = faker.helpers.arrayElements(productosProv, numItems);

    const total = items.reduce((sum, pp) => {
      const qty = faker.number.int({ min: 1, max: 5 });
      return sum + (pp.precioUnitario || 10) * qty;
    }, 0);

    const pedido = pedidoRepo.create({
      usuario: faker.helpers.arrayElement(usuarios),
      fecha_pedido: faker.date.recent({ days: 7 }),
      fecha_entrega: faker.date.soon({ days: 7 }),
      coste_total: parseFloat(total.toFixed(2)),
      estado: faker.helpers.arrayElement(Object.values(EstadoPedido)),
    });
    pedidos.push(pedido);
  }

  await pedidoRepo.save(pedidos);

  // Crear registros en tabla intermedia
  for (const pedido of pedidos) {
    const numItems = faker.number.int({ min: 1, max: 5 });
    const items = faker.helpers.arrayElements(productosProv, numItems);

    for (const pp of items) {
      const cantidad = faker.number.int({ min: 1, max: 8 });
      const precio =
        pp.precioUnitario ||
        parseFloat(faker.commerce.price({ min: 10, max: 100 }));

      const ppEntry = pedidoProductoRepo.create({
        pedido,
        productoProveedor: pp,
        cantidad,
        precio_unitario: precio,
      });
      pedidoProductos.push(ppEntry);
    }
  }

  if (pedidoProductos.length > 0) {
    await pedidoProductoRepo.save(pedidoProductos);
  }

  console.log('Seeder de pedidos ejecutado correctamente.');
};
