import { SeedContext } from './seed-context';
import { runNamedHttpSeeder } from './http-seed.catalog';
import { Recepcion } from '../modules/recepcion/recepcion.entity/recepcion.entity';
import { RecepcionPedido } from '../modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { RecepcionProducto } from '../modules/recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { Pedido } from '../modules/pedido/pedido.entity/pedido.entity';
import { PedidoProducto } from '../modules/pedido/pedido-producto.entity/pedido-producto.entity';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { EstadoPedido } from '../modules/pedido/enums/estado-pedido.enum';
import { EstadoRecepcion } from '../modules/recepcion/enums/estado-recepcion.enum';

export const runSeeder = async (context: SeedContext) => {
  if (typeof (context as any).getDataSource === 'function') {
    const pedidoRepo = (context as any).getRepository(Pedido);
    const pedidoProductoRepo = (context as any).getRepository(PedidoProducto);
    const recepcionRepo = (context as any).getRepository(Recepcion);
    const recepcionPedidoRepo = (context as any).getRepository(RecepcionPedido);
    const recepcionProductoRepo = (context as any).getRepository(
      RecepcionProducto
    );
    const usuarioRepo = (context as any).getRepository(Usuario);

    const pedidos = await pedidoRepo.find();
    await usuarioRepo.find();

    for (const pedido of pedidos) {
      if (
        ![
          EstadoPedido.PARCIAL,
          EstadoPedido.RECIBIDO,
          EstadoPedido.INCIDENCIA,
        ].includes(pedido.estado)
      ) {
        continue;
      }

      let estadoRecepcion: EstadoRecepcion;
      if (pedido.estado === EstadoPedido.PARCIAL)
        estadoRecepcion = EstadoRecepcion.PARCIAL;
      else if (pedido.estado === EstadoPedido.RECIBIDO)
        estadoRecepcion = EstadoRecepcion.COMPLETADA;
      else estadoRecepcion = EstadoRecepcion.CON_INCIDENCIAS;

      const recepcionPayload: Partial<Recepcion> = {
        observaciones: 'Creada por seeder (DB mode)',
        fechaRecepcion: new Date(),
      };

      const created =
        typeof recepcionRepo.create === 'function'
          ? recepcionRepo.create(recepcionPayload)
          : recepcionPayload;
      const savedRecepcion = await recepcionRepo.save(created);

      await recepcionPedidoRepo.save({
        pedido,
        recepcion: { estado: estadoRecepcion },
        fechaVinculacion: new Date(),
      } as any);

      const productos = await pedidoProductoRepo.find({
        where: { pedido: { id: pedido.id } },
      });
      const rpPayloads = (productos || []).map((p: any) => ({
        pedidoProductoId: p.id,
        recepcionId: savedRecepcion.id,
        cantidadRecibida: p.cantidad,
        observaciones: 'Generada por seeder (DB mode)',
      }));

      if (rpPayloads.length > 0) {
        await recepcionProductoRepo.save(rpPayloads);
      }
    }

    return;
  }

  await runNamedHttpSeeder('recepcion', context);
};
