import type { SeedContext } from '../../src/seeders/seed-context';
import { collectStateFromResponse } from '../../src/seeders/massive.helpers.state-collection';
import { EstadoPedido } from '../../src/modules/pedido/enums/estado-pedido.enum';
import { EstadoPedidoUsuario } from '../../src/modules/pedido/enums/estado-pedido-usuario.enum';
import { EstadoLote } from '../../src/modules/pedido/enums/estado-lote.enum';

describe('massive.helpers.state-collection', () => {
  function createContext(): SeedContext {
    const store = new Map<string, unknown>();
    return {
      getState: <T>(key: string) => store.get(key) as T,
      set: (key: string, value: unknown) => store.set(key, value),
    } as unknown as SeedContext;
  }

  it('tracks only actual incidencias and ignores incidencia_linea rows', () => {
    const context = createContext();

    collectStateFromResponse(context, '/incidencias', {
      data: [
        {
          id: 'incidencia-1',
          recepcionId: 'recepcion-1',
          observacionesRecepcion: 'Pendiente',
        },
        {
          id: 'incidencia-linea-1',
          incidenciaId: 'incidencia-1',
          recepcionId: 'recepcion-1',
          pedidoProductoId: 'pedido-producto-1',
        },
      ],
    });

    expect(context.getState<string[]>('incidenciaIds')).toEqual([
      'incidencia-1',
    ]);
    expect(context.getState<string[]>('incidenciaPendienteIds')).toEqual([
      'incidencia-1',
    ]);
  });

  it('removes resolved incidencias from the pending queue', () => {
    const context = createContext();

    collectStateFromResponse(context, '/incidencias', {
      data: [
        {
          id: 'incidencia-1',
          recepcionId: 'recepcion-1',
          observacionesRecepcion: 'Pendiente',
        },
      ],
    });

    collectStateFromResponse(context, '/incidencias', {
      data: [
        {
          id: 'incidencia-1',
          recepcionId: 'recepcion-1',
          fechaResolucion: '2026-04-01T10:00:00.000Z',
        },
      ],
    });

    expect(context.getState<string[]>('incidenciaPendienteIds')).toEqual([]);
  });

  it('tracks pending and receivable pedido queues with current enum values', () => {
    const context = createContext();

    collectStateFromResponse(context, '/pedidos', {
      data: [
        {
          id: 'pedido-pendiente',
          usuarioId: 'usuario-1',
          proveedorId: 'proveedor-1',
          fechaPedido: '2026-04-01T10:00:00.000Z',
          estado: EstadoPedido.PENDIENTE_DE_APROBACION,
        },
        {
          id: 'pedido-recepcionar',
          usuarioId: 'usuario-2',
          proveedorId: 'proveedor-2',
          fechaPedido: '2026-04-01T10:05:00.000Z',
          estado: EstadoPedido.POR_RECEPCIONAR,
        },
      ],
    });

    expect(context.getState<string[]>('pedidoPendienteIds')).toEqual([
      'pedido-pendiente',
    ]);
    expect(context.getState<string[]>('pedidoReceivableIds')).toEqual([
      'pedido-recepcionar',
    ]);
    expect(context.getState<string[]>('pedidoListIds')).toEqual([
      'pedido-pendiente',
      'pedido-recepcionar',
    ]);
    expect(context.getState<string[]>('pedidoPendingListIds')).toEqual([
      'pedido-pendiente',
    ]);
    expect(context.getState<string[]>('pedidoReceivableListIds')).toEqual([
      'pedido-recepcionar',
    ]);
  });

  it('moves pedidos out of pending queue when they become receivable', () => {
    const context = createContext();

    collectStateFromResponse(context, '/pedidos', {
      data: [
        {
          id: 'pedido-1',
          usuarioId: 'usuario-1',
          proveedorId: 'proveedor-1',
          fechaPedido: '2026-04-01T10:00:00.000Z',
          estado: EstadoPedido.PENDIENTE_DE_APROBACION,
        },
      ],
    });

    collectStateFromResponse(context, '/pedidos', {
      data: [
        {
          id: 'pedido-1',
          usuarioId: 'usuario-1',
          proveedorId: 'proveedor-1',
          fechaPedido: '2026-04-01T10:00:00.000Z',
          estado: EstadoPedido.POR_RECEPCIONAR,
        },
      ],
    });

    expect(context.getState<string[]>('pedidoPendienteIds')).toEqual([]);
    expect(context.getState<string[]>('pedidoReceivableIds')).toEqual([
      'pedido-1',
    ]);
  });

  it('tracks only actual productos in productoIds while preserving nested relations', () => {
    const context = createContext();

    collectStateFromResponse(context, '/productos', {
      data: [
        {
          id: 'producto-1',
          nombre: 'Tomate',
          contenido: 1,
          pmp: 2.5,
          proveedores: [
            {
              id: 'producto-proveedor-1',
              proveedorId: 'proveedor-1',
              precioUnitario: 2.5,
            },
          ],
        },
      ],
    });

    expect(context.getState<string[]>('productoIds')).toEqual(['producto-1']);
    expect(context.getState<string[]>('proveedorIds')).toEqual(['proveedor-1']);
    expect(context.getState<string[]>('productoProveedorIds')).toEqual([
      'producto-proveedor-1',
    ]);
  });

  it('tracks only actual pedido-usuarios and uses the correct pending enum', () => {
    const context = createContext();

    collectStateFromResponse(context, '/pedido-usuarios', {
      data: [
        {
          id: 'pedido-usuario-1',
          numeroGlobal: '1001',
          fechaPedido: '2026-04-01T10:00:00.000Z',
          estado: EstadoPedidoUsuario.PENDIENTE,
          pedidos: [
            {
              id: 'pedido-1',
              usuarioId: 'usuario-1',
              proveedorId: 'proveedor-1',
              fechaPedido: '2026-04-01T10:05:00.000Z',
              estado: EstadoPedido.PENDIENTE_DE_APROBACION,
            },
          ],
        },
      ],
    });

    expect(context.getState<string[]>('pedidoUsuarioIds')).toEqual([
      'pedido-usuario-1',
    ]);
    expect(context.getState<string[]>('pedidoUsuarioPendienteIds')).toEqual([
      'pedido-usuario-1',
    ]);
  });

  it('tracks purchase-batches even when numeroGlobal is a string', () => {
    const context = createContext();

    collectStateFromResponse(context, '/purchase-batches', {
      data: [
        {
          id: 'purchase-batch-1',
          numeroGlobal: '100001',
          referencia: 'LC-100001',
          estado: EstadoLote.PENDIENTE,
          pedidos: [],
        },
      ],
    });

    expect(context.getState<string[]>('purchaseBatchIds')).toEqual([
      'purchase-batch-1',
    ]);
    expect(context.getState<string[]>('purchaseBatchPendienteIds')).toEqual([
      'purchase-batch-1',
    ]);
  });

  it('tracks only actual recetas and ignores nested ingrediente ids', () => {
    const context = createContext();

    collectStateFromResponse(context, '/recetas', {
      data: [
        {
          id: 'receta-1',
          nombre: 'Sopa',
          instrucciones: 'Cocer',
          tiempoEstimadoMinutos: 15,
          ingredientes: [
            {
              id: 'ingrediente-1',
              productoId: 'producto-1',
            },
          ],
        },
      ],
    });

    expect(context.getState<string[]>('recetaIds')).toEqual(['receta-1']);
  });
});
