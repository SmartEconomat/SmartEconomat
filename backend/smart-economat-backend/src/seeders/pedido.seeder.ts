import { faker } from '@faker-js/faker';
import { DataSource } from 'typeorm';
import {
  Pedido,
  EstadoPedido,
} from '../modules/pedido/pedido.entity/pedido.entity';
import { PedidoProducto } from '../modules/pedido/pedido-producto.entity/pedido-producto.entity';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';
import { PurchaseBatch } from '../modules/pedido/purchase-batch.entity/purchase-batch.entity';
import { EstadoLote } from '../modules/pedido/enums/estado-lote.enum';
import { ProductoProveedor } from '../modules/producto/producto-proveedor.entity/producto-proveedor.entity';

export const runSeeder = async (dataSource: DataSource) => {
  
  const pedidoRepo = dataSource.getRepository(Pedido);
  const pedidoProductoRepo = dataSource.getRepository(PedidoProducto);
  const usuarioRepo = dataSource.getRepository(Usuario);
  const productoProveedorRepo = dataSource.getRepository(ProductoProveedor);

  const usuarios = await usuarioRepo.find({ take: 5 });

  console.log('Obteniendo muestra de productos/proveedores...');
  const samplePPS = await productoProveedorRepo.find({
    relations: ['proveedor'],
    take: 100,
  });

  if (usuarios.length === 0) {
    console.warn(SeederI18nHelper.getError('NO_USUARIOS'));
    return;
  }
  if (samplePPS.length === 0) {
    console.warn(SeederI18nHelper.getError('NO_PRODUCTOS_PROVEEDOR'));
    return;
  }

  const ppsGroupedByProv = new Map<string, any>();
  for (const pp of samplePPS) {
    if (!pp.proveedor) continue;
    if (!ppsGroupedByProv.has(pp.proveedor.id)) {
      ppsGroupedByProv.set(pp.proveedor.id, {
        ...pp.proveedor,
        productos: [],
      });
    }
    ppsGroupedByProv.get(pp.proveedor.id).productos.push(pp);
  }

  const proveedoresValidos = Array.from(ppsGroupedByProv.values());

  const batchRepo = dataSource.getRepository(PurchaseBatch);

  const allStates = Object.values(EstadoPedido);
  const numBatches = process.env.NODE_ENV === 'test' ? 1 : 3;

  for (let batchIdx = 0; batchIdx < numBatches; batchIdx++) {
    const usuarioLote = faker.helpers.arrayElement(usuarios);

    const batch = batchRepo.create({
      usuario: usuarioLote,
      observaciones: `Lote automático de pedidos #${batchIdx + 1}`,
      estado: EstadoLote.PENDIENTE,
    });
    const savedBatch = await batchRepo.save(batch);

    const pedidosMapear =
      process.env.NODE_ENV === 'test'
        ? allStates.slice(0, 2)
        : batchIdx === 0
          ? allStates
          : faker.helpers.arrayElements(allStates, 3);

    const pedidosInsertar: Pedido[] = [];

    for (const estado of pedidosMapear) {
      const randomProveedor = faker.helpers.arrayElement(proveedoresValidos);
      const pedido = pedidoRepo.create({
        usuario: usuarioLote,
        proveedor: randomProveedor,
        batch: savedBatch,
        fechaPedido: faker.date.recent({ days: 7 }),
        fechaEntrega: faker.date.soon({ days: 14 }),
        estado: estado,
        costeTotal: 0,
      });

      if (pedido.estado === EstadoPedido.CANCELADO) {
        pedido.motivoCancelacion = faker.lorem.sentence();
      }

      if (pedido.estado === EstadoPedido.INCIDENCIA) {
        pedido.motivoIncidencia = 'Discrepancias en la recepción visual.';
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

      for (const pp of itemsSeleccionados as ProductoProveedor[]) {
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
      pedidosInsertar.push(pedido);
    }

    const savedPedidos = await pedidoRepo.save(pedidosInsertar);

    savedBatch.estado = PurchaseBatch.calcularEstadoLote(savedPedidos);
    await batchRepo.save(savedBatch);
  }

  console.log(SeederI18nHelper.getSeederSuccess('pedidos'));
};
