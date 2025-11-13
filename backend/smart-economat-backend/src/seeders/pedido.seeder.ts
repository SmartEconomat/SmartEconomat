import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Pedido } from '../modules/pedidos/pedido.entity/pedido.entity';
import { PedidoProducto } from '../modules/pedidos/pedido-producto.entity/pedido-producto.entity';
import { EstadoPedido } from '../modules/pedidos/enums/estado-pedido.enum';
import { ProductoProveedor } from 'src/modules/productos/producto-proveedor.entity/producto-proveedor.entity';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');

  const pedidoRepo = dataSource.getRepository(Pedido);
  const pedidoProductoRepo = dataSource.getRepository(PedidoProducto);
  const productoProveedorRepo = dataSource.getRepository(ProductoProveedor);

  const pedidos: Pedido[] = [];
  const fechaFutura = (faker.date.soon as (opts: { days: number }) => Date)({
    days: 7,
  });
  const costeTotal = parseFloat(
    (
      faker.commerce.price as (opts: {
        min: number;
        max: number;
        dec: number;
      }) => string
    )({ min: 10, max: 100, dec: 2 })
  );

  for (let i = 0; i < 5; i++) {
    const pedido: Pedido = pedidoRepo.create({
      id_usuario: uuidv4(),
      fecha_entrega: fechaFutura,
      coste_total: costeTotal,
      estado: EstadoPedido.PENDIENTE,
    });
    pedidos.push(pedido);
  }
  await pedidoRepo.save(pedidos);

  const todosLosProductosProveedor = await productoProveedorRepo.find();
  if (!todosLosProductosProveedor.length) {
    throw new Error(
      'No hay productos-proveedor en la base de datos. Primero debes crear algunos.'
    );
  }

  const pedidoProductos: PedidoProducto[] = [];
  for (const pedido of pedidos) {
    const productosCount = (
      faker.number.int as (opts: { min: number; max: number }) => number
    )({ min: 1, max: 5 });

    for (let j = 0; j < productosCount; j++) {
      const cantidad = (
        faker.number.int as (opts: { min: number; max: number }) => number
      )({ min: 1, max: 20 });

      const precioUnitario = parseFloat(
        (
          faker.commerce.price as (opts: {
            min: number;
            max: number;
            dec: number;
          }) => string
        )({ min: 10, max: 100, dec: 2 })
      );

      const productoProveedor =
        todosLosProductosProveedor[
          (faker.number.int as (opts: { min: number; max: number }) => number)({
            min: 0,
            max: todosLosProductosProveedor.length - 1,
          })
        ];

      const pedidoProducto = pedidoProductoRepo.create({
        pedido,
        productoProveedor,
        cantidad,
        precioUnitario: precioUnitario,
      });

      pedidoProductos.push(pedidoProducto);
    }
  }

  await pedidoProductoRepo.save(pedidoProductos);
};
