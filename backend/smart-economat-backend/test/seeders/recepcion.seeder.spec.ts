import { runSeeder } from '../../src/seeders/recepcion.seeder';
import { EstadoPedido } from '../../src/modules/pedido/enums/estado-pedido.enum';
import { EstadoProductoRecepcion } from '../../src/modules/recepcion/enums/estado-producto.enum';
import { EstadoVisualProducto } from '../../src/modules/recepcion/enums/estado-visual.enum';
import { SeedContext } from '../../src/seeders/seed-context';
import {
  DETERMINISTIC_SHORT_NOTES,
  deterministicBool,
  deterministicCode,
  deterministicInt,
  pickDeterministic,
  seedDateIso,
} from '../../src/seeders/deterministic.seed-data';

function seedIndexFromId(id: string): number {
  const compact = id.replace(/[^a-fA-F0-9]/g, '').slice(0, 8);
  const parsed = Number.parseInt(compact || '0', 16);
  return Number.isFinite(parsed) ? parsed : 0;
}

describe('recepcion.seeder', () => {
  it('solo crea recepciones para pedidos por recepcionar usando el endpoint HTTP canónico', async () => {
    const pedidoId = 'pedido-por-recepcionar';
    const baseSeed = seedIndexFromId(pedidoId);
    const nAlbaran = deterministicCode(
      'ALB-SEED-',
      baseSeed,
      10,
      'recepcion-nalbaran'
    );
    const observacion = `Recepcion generada por seeder para pedido ${pedidoId}. ${pickDeterministic(
      DETERMINISTIC_SHORT_NOTES,
      baseSeed,
      'recepcion-observacion'
    )}`;

    const getJson = jest.fn((path: string) => {
      if (path === '/pedidos?limit=50&page=1') {
        return Promise.resolve({
          data: [
            {
              id: 'pedido-pendiente',
              estado: EstadoPedido.PENDIENTE_DE_APROBACION,
            },
            {
              id: pedidoId,
              estado: EstadoPedido.POR_RECEPCIONAR,
            },
            { id: 'pedido-parcial', estado: EstadoPedido.PARCIAL },
            { id: 'pedido-recibido', estado: EstadoPedido.RECEPCIONADO },
            { id: 'pedido-incidencia', estado: EstadoPedido.INCIDENCIA },
            { id: 'pedido-cancelado', estado: EstadoPedido.CANCELADO },
          ],
          totalPages: 1,
        });
      }

      if (path === `/pedidos/${pedidoId}`) {
        return Promise.resolve({
          id: pedidoId,
          estado: EstadoPedido.POR_RECEPCIONAR,
          pedidoProductos: [{ id: 'pp-1', cantidad: 3 }],
        });
      }

      throw new Error(`Ruta no esperada: ${path}`);
    });

    const postJson = jest.fn().mockResolvedValue({ id: 'recepcion-1' });

    const context = {
      getJson,
      postJson,
    } as unknown as SeedContext;

    await runSeeder(context);

    expect(postJson).toHaveBeenCalledTimes(1);
    expect(postJson).toHaveBeenCalledWith('/recepciones', {
      pedidos: [
        {
          pedidoId,
          nAlbaran,
          observaciones: observacion,
        },
      ],
      nAlbaran,
      fechaRecepcion: seedDateIso(
        deterministicInt(0, 3, baseSeed, 'recepcion-fecha')
      ),
      observaciones: observacion,
      productos: [
        {
          pedidoProductoId: 'pp-1',
          cantidadRecibida: 3,
          cantidadAlbaran: 3,
          estadoVisual: EstadoVisualProducto.OPTIMO,
          estadoProducto: EstadoProductoRecepcion.PERFECTO,
          fechaCaducidad: seedDateIso(
            deterministicInt(15, 45, baseSeed, 'recepcion-linea-caducidad')
          ),
          observaciones: pickDeterministic(
            DETERMINISTIC_SHORT_NOTES,
            baseSeed,
            'recepcion-linea-observacion'
          ),
          isWeighedWithScale: deterministicBool(
            baseSeed,
            'recepcion-linea-peso'
          ),
        },
      ],
    });
  });

  it('no crea recepciones cuando no hay pedidos por recepcionar', async () => {
    const postJson = jest.fn();
    const context = {
      getJson: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'pedido-pendiente',
            estado: EstadoPedido.PENDIENTE_DE_APROBACION,
          },
        ],
        totalPages: 1,
      }),
      postJson,
    } as unknown as SeedContext;

    await runSeeder(context);

    expect(postJson).not.toHaveBeenCalled();
  });
});
