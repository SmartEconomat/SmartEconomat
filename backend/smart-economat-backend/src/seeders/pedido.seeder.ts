import { DataSource } from 'typeorm';
import { Pedido } from '../modules/pedido/pedido.entity/pedido.entity';
import { PedidoProducto } from '../modules/pedido/pedido-producto.entity/pedido-producto.entity';
import { EstadoPedido } from '../modules/pedido/enums/estado-pedido.enum';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { ProductoProveedor } from '../modules/producto/producto-proveedor.entity/producto-proveedor.entity';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const pedidoRepo = dataSource.getRepository(Pedido);
  const pedidoProductoRepo = dataSource.getRepository(PedidoProducto);
  const usuarioRepo = dataSource.getRepository(Usuario);
  const productoProveedorRepo = dataSource.getRepository(ProductoProveedor);

  const usuarios = await usuarioRepo.find();
  const productosProv = await productoProveedorRepo.find({
    relations: ['producto'],
  });

  if (usuarios.length === 0) throw new Error('No hay usuarios');
  if (productosProv.length === 0)
    throw new Error('No hay productos con proveedor');

  await dataSource.query(`
    TRUNCATE TABLE "pedido_productos", "pedido" RESTART IDENTITY CASCADE;
  `);

  const pedidos: Pedido[] = [];
  for (let i = 0; i < 8; i++) {
    const pedido = new Pedido();
    pedido.usuario = faker.helpers.arrayElement(usuarios);
    pedido.fechaPedido = faker.date.recent({ days: 7 });
    pedido.fechaEntrega = faker.date.soon({ days: 7 });
    pedido.estado = faker.helpers.arrayElement(Object.values(EstadoPedido));
    pedido.costeTotal = 0;
    pedidos.push(pedido);
  }
  await pedidoRepo.save(pedidos);

  for (const pedido of pedidos) {
    const numItems = faker.number.int({ min: 1, max: 5 });
    const items = faker.helpers.arrayElements(productosProv, numItems);

    let total = 0;
    const pedidoProductosToSave: PedidoProducto[] = [];

    for (const pp of items) {
      const cantidad = faker.number.int({ min: 1, max: 8 });
      const precio =
        pp.precioUnitario ||
        parseFloat(faker.commerce.price({ min: 10, max: 100 }));
      total += precio * cantidad;

      const ppEntry = new PedidoProducto();
      ppEntry.pedido = pedido;
      ppEntry.productoProveedor = pp;
      ppEntry.cantidad = cantidad;
      ppEntry.precio_unitario = precio;
      ppEntry.observaciones = faker.datatype.boolean(0.3)
        ? faker.lorem.sentence()
        : undefined;

      pedidoProductosToSave.push(ppEntry);
    }

    if (pedidoProductosToSave.length > 0) {
      await pedidoProductoRepo.save(pedidoProductosToSave);
    }

    pedido.costeTotal = parseFloat(total.toFixed(2));
    await pedidoRepo.save(pedido);
  }

  console.log('Seeder de pedidos ejecutado correctamente.');
};
