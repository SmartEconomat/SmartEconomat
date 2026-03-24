import { SeedContext } from './seed-context';
import { faker } from '@faker-js/faker';
import { Recepcion } from '../modules/recepcion/recepcion.entity/recepcion.entity';
import { RecepcionPedido } from '../modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { RecepcionProducto } from '../modules/recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { Pedido } from '../modules/pedido/pedido.entity/pedido.entity';
import { PedidoProducto } from '../modules/pedido/pedido-producto.entity/pedido-producto.entity';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';
import { EstadoProductoRecepcion } from '../modules/recepcion/enums/estado-producto.enum';
import { EstadoRecepcion } from '../modules/recepcion/enums/estado-recepcion.enum';

export const runSeeder = async (context: SeedContext) => {
  const dataSource = context.getDataSource();
  const recepcionRepo = dataSource.getRepository(Recepcion);
  const recepcionPedidoRepo = dataSource.getRepository(RecepcionPedido);
  const recepcionProductoRepo = dataSource.getRepository(RecepcionProducto);
  const pedidoRepo = dataSource.getRepository(Pedido);
  const pedidoProductoRepo = dataSource.getRepository(PedidoProducto);
  const usuarioRepo = dataSource.getRepository(Usuario);

  const pedidos = await pedidoRepo.find();
  const usuarios = await usuarioRepo.find();

  if (pedidos.length === 0) {
    console.warn(SeederI18nHelper.getError('NO_PEDIDOS'));
    return;
  }
  if (usuarios.length === 0) {
    console.warn(SeederI18nHelper.getError('NO_USUARIOS'));
    return;
  }

  const todosLosEstados = Object.values(EstadoRecepcion);
  const totalEstados = todosLosEstados.length;

  for (let i = 0; i < pedidos.length; i++) {
    const pedido = pedidos[i];
    const pedidoProductos = await pedidoProductoRepo.find({
      where: { pedido: { id: pedido.id } },
      relations: ['productoProveedor'],
    });

    if (pedidoProductos.length === 0) continue;

    const estadoAsignado = todosLosEstados[i % totalEstados];
    const tieneIncidencia = estadoAsignado === EstadoRecepcion.CON_INCIDENCIAS;

    const recepcion = recepcionRepo.create({
      usuario: faker.helpers.arrayElement(usuarios),
      fechaRecepcion: faker.date.recent({ days: 3 }),
      estado: estadoAsignado,
      incidencia: tieneIncidencia,
      observaciones:
        faker.datatype.boolean(0.6) || tieneIncidencia
          ? `Recepción importada por seeder en estado ${estadoAsignado}. ${faker.lorem.sentence()}`
          : undefined,
    });
    const recepcionGuardada = await recepcionRepo.save(recepcion);

    const rp = recepcionPedidoRepo.create({
      recepcion: recepcionGuardada,
      pedido: pedido,
      fechaVinculacion: faker.date.recent(),
    });
    await recepcionPedidoRepo.save(rp);

    const recepcionesProd: RecepcionProducto[] = [];

    const numMaxRecibir =
      estadoAsignado === EstadoRecepcion.COMPLETADA
        ? pedidoProductos.length
        : faker.number.int({ min: 1, max: pedidoProductos.length });

    const seleccionados = faker.helpers.arrayElements(
      pedidoProductos,
      numMaxRecibir
    );

    for (const pp of seleccionados) {
      const cantidadPedida = Number(pp.cantidad);
      let recibida = cantidadPedida;

      if (estadoAsignado === EstadoRecepcion.PARCIAL) {
        recibida = faker.number.int({
          min: 1,
          max: Math.floor(cantidadPedida),
        });

        if (recibida === cantidadPedida) recibida = Math.max(0, recibida - 1);
      } else if (estadoAsignado === EstadoRecepcion.CON_INCIDENCIAS) {
        recibida = faker.number.int({
          min: 0,
          max: Math.floor(cantidadPedida) + 3,
        });
      }

      const isWeighedScaleRand = faker.datatype.boolean(0.2);
      const estadoProdRand = faker.helpers.arrayElement(
        Object.values(EstadoProductoRecepcion)
      );

      recepcionesProd.push(
        recepcionProductoRepo.create({
          recepcion: recepcionGuardada,
          pedidoProducto: pp,
          cantidadRecibida: recibida,
          observaciones:
            recibida !== cantidadPedida ||
            estadoProdRand !== EstadoProductoRecepcion.PERFECTO
              ? faker.lorem.sentence()
              : faker.datatype.boolean(0.3)
                ? faker.lorem.sentence()
                : undefined,
          estadoProducto:
            estadoAsignado === EstadoRecepcion.CON_INCIDENCIAS
              ? estadoProdRand
              : EstadoProductoRecepcion.PERFECTO,
          fechaRecepcion: recepcionGuardada.fechaRecepcion,
          isWeighedWithScale: isWeighedScaleRand,
        })
      );
    }

    if (recepcionesProd.length > 0) {
      await recepcionProductoRepo.save(recepcionesProd);
    }
  }

  console.log(SeederI18nHelper.getSeederSuccess('recepciones'));
};
