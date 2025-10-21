import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { PedidoEntity } from '../modules/pedidos/pedido.entity/pedido.entity';
import { PedidoProductoEntity } from '../modules/pedidos/pedido-producto.entity/pedido-producto.entity';
import { EstadoPedido } from '../modules/pedidos/enums/estado-pedido.enum';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');

  const pedidoRepo = dataSource.getRepository(PedidoEntity);
  const pedidoProductoRepo = dataSource.getRepository(PedidoProductoEntity);

  const pedidos: PedidoEntity[] = [];
  for (let i = 0; i < 5; i++) {
    const pedido = pedidoRepo.create({
      id_usuario: uuidv4(),
      fecha_entrega: faker.date.soon({ days: 7 }),
      coste_total: parseFloat(faker.commerce.price()),
      estado: EstadoPedido.PENDIENTE,
    });
    pedidos.push(pedido);
  }

  await pedidoRepo.save(pedidos);

  const pedidoProductos: PedidoProductoEntity[] = [];
  for (const pedido of pedidos) {
    const productosCount = faker.number.int({ min: 1, max: 5 });
    for (let j = 0; j < productosCount; j++) {
      const producto = pedidoProductoRepo.create({
        pedido,
        id_producto_proveedor: uuidv4(),
        cantidad: faker.number.int({ min: 1, max: 20 }),
        precio_unitario: parseFloat(faker.commerce.price()),
      });
      pedidoProductos.push(producto);
    }
  }

  await pedidoProductoRepo.save(pedidoProductos);

  console.log('Seeder ejecutado correctamente');
};
