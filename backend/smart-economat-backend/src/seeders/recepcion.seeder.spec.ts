import { DataSource } from 'typeorm';
import { runSeeder } from './recepcion.seeder';
import { Recepcion } from '../modules/recepcion/recepcion.entity/recepcion.entity';
import { RecepcionPedido } from '../modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { RecepcionProducto } from '../modules/recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { Pedido } from '../modules/pedido/pedido.entity/pedido.entity';
import { PedidoProducto } from '../modules/pedido/pedido-producto.entity/pedido-producto.entity';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { EstadoPedido } from '../modules/pedido/enums/estado-pedido.enum';
import { EstadoRecepcion } from '../modules/recepcion/enums/estado-recepcion.enum';

jest.mock('@faker-js/faker', () => ({
  faker: {
    helpers: {
      arrayElement: jest.fn((items: unknown[]) => items[0]),
      arrayElements: jest.fn((items: unknown[], count?: number) =>
        items.slice(0, count ?? items.length)
      ),
    },
    date: {
      recent: jest.fn(() => new Date('2026-03-20T10:00:00.000Z')),
    },
    datatype: {
      boolean: jest.fn(() => false),
    },
    number: {
      int: jest.fn(({ min }: { min: number }) => min),
    },
    lorem: {
      sentence: jest.fn(() => 'Observación de prueba'),
    },
  },
}));

describe('recepcion.seeder', () => {
  it('solo crea recepciones para pedidos ya recepcionables y nunca para pendientes', async () => {
    const pedidos = [
      { id: 'pedido-pendiente', estado: EstadoPedido.PENDIENTE },
      { id: 'pedido-en-proceso', estado: EstadoPedido.EN_PROCESO },
      { id: 'pedido-parcial', estado: EstadoPedido.PARCIAL },
      { id: 'pedido-recibido', estado: EstadoPedido.RECIBIDO },
      { id: 'pedido-incidencia', estado: EstadoPedido.INCIDENCIA },
      { id: 'pedido-cancelado', estado: EstadoPedido.CANCELADO },
    ] as Pedido[];

    const pedidoProductosPorPedido: Record<string, PedidoProducto[]> = {
      'pedido-parcial': [{ id: 'pp-1', cantidad: 3 } as PedidoProducto],
      'pedido-recibido': [{ id: 'pp-2', cantidad: 2 } as PedidoProducto],
      'pedido-incidencia': [{ id: 'pp-3', cantidad: 4 } as PedidoProducto],
    };

    const recepcionesGuardadas: Array<{
      pedidoId: string;
      estado: EstadoRecepcion;
    }> = [];

    type RecepcionSeedPayload = Partial<Recepcion>;
    type RecepcionPedidoSeedPayload = {
      pedido: Pedido;
      recepcion: { estado: EstadoRecepcion };
      fechaVinculacion?: Date;
    };
    type RecepcionProductoSeedPayload = Partial<RecepcionProducto>;

    const recepcionRepo = {
      create: jest.fn(
        (payload: RecepcionSeedPayload): RecepcionSeedPayload => payload
      ),
      save: jest.fn((payload: RecepcionSeedPayload) =>
        Promise.resolve({
          id: `recepcion-${recepcionesGuardadas.length + 1}`,
          ...payload,
        })
      ),
    };

    const recepcionPedidoRepo = {
      create: jest.fn(
        (payload: RecepcionPedidoSeedPayload): RecepcionPedidoSeedPayload =>
          payload
      ),
      save: jest.fn((payload: RecepcionPedidoSeedPayload) => {
        recepcionesGuardadas.push({
          pedidoId: payload.pedido.id,
          estado: payload.recepcion.estado,
        });
        return Promise.resolve(payload);
      }),
    };

    const recepcionProductoRepo = {
      create: jest.fn(
        (payload: RecepcionProductoSeedPayload): RecepcionProductoSeedPayload =>
          payload
      ),
      save: jest.fn((payload: RecepcionProductoSeedPayload[]) =>
        Promise.resolve(payload)
      ),
    };

    const pedidoRepo = {
      find: jest.fn().mockResolvedValue(pedidos),
    };

    const pedidoProductoRepo = {
      find: jest.fn(({ where }: { where: { pedido: { id: string } } }) =>
        Promise.resolve(pedidoProductosPorPedido[where.pedido.id] || [])
      ),
    };

    const usuarioRepo = {
      find: jest.fn().mockResolvedValue([{ id: 'user-1' } as Usuario]),
    };

    const dataSource = {
      getRepository: jest.fn((entity: unknown) => {
        switch (entity) {
          case Recepcion:
            return recepcionRepo;
          case RecepcionPedido:
            return recepcionPedidoRepo;
          case RecepcionProducto:
            return recepcionProductoRepo;
          case Pedido:
            return pedidoRepo;
          case PedidoProducto:
            return pedidoProductoRepo;
          case Usuario:
            return usuarioRepo;
          default:
            throw new Error('Repositorio no mockeado');
        }
      }),
    } as unknown as DataSource;

    await runSeeder(dataSource);

    expect(recepcionRepo.save).toHaveBeenCalledTimes(3);
    expect(recepcionesGuardadas).toEqual([
      {
        pedidoId: 'pedido-parcial',
        estado: EstadoRecepcion.PARCIAL,
      },
      {
        pedidoId: 'pedido-recibido',
        estado: EstadoRecepcion.COMPLETADA,
      },
      {
        pedidoId: 'pedido-incidencia',
        estado: EstadoRecepcion.CON_INCIDENCIAS,
      },
    ]);
    expect(recepcionesGuardadas.map((item) => item.pedidoId)).not.toContain(
      'pedido-pendiente'
    );
    expect(recepcionesGuardadas.map((item) => item.pedidoId)).not.toContain(
      'pedido-en-proceso'
    );
    expect(recepcionesGuardadas.map((item) => item.pedidoId)).not.toContain(
      'pedido-cancelado'
    );
  });
});
