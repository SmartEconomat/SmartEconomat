import { DataSource } from 'typeorm';
import {
  Pedido,
  EstadoPedido,
} from '../modules/pedido/pedido.entity/pedido.entity';
import { PedidoProducto } from '../modules/pedido/pedido-producto.entity/pedido-producto.entity';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { Proveedor } from '../modules/proveedor/proveedor.entity/proveedor.entity';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const pedidoRepo = dataSource.getRepository(Pedido);
  const pedidoProductoRepo = dataSource.getRepository(PedidoProducto);
  const usuarioRepo = dataSource.getRepository(Usuario);
  const proveedorRepo = dataSource.getRepository(Proveedor);

  const usuarios = await usuarioRepo.find();
  const proveedores = await proveedorRepo.find({ relations: ['productos'] });

  const proveedoresValidos = proveedores.filter(
    (p) => p.productos && p.productos.length > 0
  );

  if (usuarios.length === 0) {
    throw new Error(SeederI18nHelper.getError('NO_USUARIOS'));
  }
  if (proveedoresValidos.length === 0) {
    throw new Error(SeederI18nHelper.getError('NO_PRODUCTOS_PROVEEDOR'));
  }

  for (let i = 0; i < (process.env.NODE_ENV === 'test' ? 2 : 8); i++) {
    const randomProveedor = faker.helpers.arrayElement(proveedoresValidos);
    const pedido = pedidoRepo.create({
      usuario: faker.helpers.arrayElement(usuarios),
      proveedor: randomProveedor,
      fechaPedido: faker.date.recent({ days: 7 }),
      fechaEntrega: faker.date.soon({ days: 14 }),
      estado: faker.helpers.arrayElement(Object.values(EstadoPedido)),
      costeTotal: 0,
    });

    if (pedido.estado === EstadoPedido.CANCELADO) {
      pedido.motivoCancelacion = faker.lorem.sentence();
    }

    const numItems = faker.number.int({
      min: 1,
      max: Math.min(5, randomProveedor.productos.length),
    });
    const itemsSeleccionados = faker.helpers.arrayElements(
      randomProveedor.productos,
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
          productoProveedor: pp,
          cantidad: cantidad,
          precioUnitario: precioUnitario,
          observaciones: faker.datatype.boolean()
            ? faker.lorem.sentence()
            : undefined,
        })
      );
    }

    pedido.pedidoProductos = detallesPedido as any;
    pedido.costeTotal = parseFloat(acumuladoTotal.toFixed(2));

    await pedidoRepo.save(pedido);
  }

  console.log(SeederI18nHelper.getSeederSuccess('pedidos'));
};
