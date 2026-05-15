import { buildBodyOrdersAndReception } from '../../src/seeders/massive.helpers.body.orders';
import { createEnumCoverage } from '../../src/seeders/massive.helpers.common';
import type { BuildBodyEnv } from '../../src/seeders/massive.helpers.body.shared';
import type { SeedContext } from '../../src/seeders/seed-context';

describe('massive.helpers.body.orders', () => {
  function createContext(initialState: Record<string, unknown>): SeedContext {
    const store = new Map<string, unknown>(Object.entries(initialState));
    return {
      getState: <T>(key: string) => store.get(key) as T,
      set: (key: string, value: unknown) => store.set(key, value),
    } as unknown as SeedContext;
  }

  function createEnv(
    context: SeedContext,
    overrides: Partial<BuildBodyEnv> = {}
  ): BuildBodyEnv {
    return {
      context,
      endpoint: {
        method: 'POST',
        path: '/purchase-batches/consolidate',
        source: 'spec',
      },
      resolvedPath: '/purchase-batches/consolidate',
      iteration: 0,
      coverage: {} as BuildBodyEnv['coverage'],
      templatePath: '/purchase-batches/consolidate',
      runTag: 'spec',
      suffix: 'spec',
      roleValue: '',
      statusValue: '',
      unidadProducto: '',
      tipoProducto: '',
      alergeno: '',
      movimientoTipo: '',
      manualTipo: '',
      recetaDificultad: '',
      recetaUnidad: '',
      incidenciaTipo: '',
      incidenciaEstadoObjetivo: 'abierta',
      resolucionTipo: '',
      mermaMotivo: '',
      estadoVisual: '',
      estadoProducto: '',
      proveedorId: '',
      productoId: '',
      productoProveedorId: '',
      recetaId: '',
      pedidoId: '',
      inventarioId: '',
      recepcionId: '',
      ubicacionId: '',
      pedidoProductoId: '',
      usuarioId: '',
      roleId: '',
      permissionId: '',
      pickRequired: (key: string) => {
        const values = context.getState<string[]>(key) || [];
        return values[0] || '';
      },
      ...overrides,
    };
  }

  it('uses canonical pedido-usuario ids for consolidate requests', () => {
    const context = createContext({
      seedCreatedPedidoUsuarioPendienteIds: ['pedido-usuario-1'],
      pedidoPendienteIds: ['pedido-1', 'pedido-2', 'pedido-9'],
      pedidoUsuarioToPedidoPairs: [
        'pedido-usuario-1|pedido-1',
        'pedido-usuario-1|pedido-2',
        'pedido-usuario-2|pedido-9',
      ],
    });

    const body = buildBodyOrdersAndReception(createEnv(context));

    expect(body).toEqual(
      expect.objectContaining({
        pedidoUsuarioIds: ['pedido-usuario-1'],
      })
    );
    expect(body).not.toHaveProperty('pedidoIds');
  });

  it('falls back to pending pedido-usuario ids when no fresh consolidation list exists', () => {
    const context = createContext({
      seedCreatedPedidoUsuarioPendienteIds: ['pedido-usuario-1'],
      pedidoPendienteIds: ['pedido-directo-1'],
    });

    const body = buildBodyOrdersAndReception(createEnv(context));

    expect(body).toEqual(
      expect.objectContaining({
        pedidoUsuarioIds: ['pedido-usuario-1'],
      })
    );
    expect(body).not.toHaveProperty('pedidoIds');
  });

  it('prefers freshly precreated consolidate pedido-usuario ids when available', () => {
    const context = createContext({
      seedConsolidatePedidoUsuarioIds: [
        'pedido-usuario-fresh-1',
        'pedido-usuario-fresh-2',
      ],
      seedCreatedPedidoUsuarioPendienteIds: ['pedido-usuario-1'],
      pedidoPendienteIds: ['pedido-legacy-1'],
      pedidoUsuarioToPedidoPairs: ['pedido-usuario-1|pedido-legacy-1'],
    });

    const body = buildBodyOrdersAndReception(createEnv(context));

    expect(body).toEqual(
      expect.objectContaining({
        pedidoUsuarioIds: ['pedido-usuario-fresh-1', 'pedido-usuario-fresh-2'],
      })
    );
    expect(body).not.toHaveProperty('pedidoIds');
  });

  it('builds canonical payloads for pedido-usuarios/from-missing-stock', () => {
    const context = createContext({
      seedCreatedRecetaIds: ['receta-1', 'receta-2'],
    });

    const body = buildBodyOrdersAndReception(
      createEnv(context, {
        endpoint: {
          method: 'POST',
          path: '/pedido-usuarios/from-missing-stock',
          source: 'spec',
        },
        resolvedPath: '/pedido-usuarios/from-missing-stock',
        templatePath: '/pedido-usuarios/from-missing-stock',
      })
    );

    expect(body).toEqual(
      expect.objectContaining({
        observaciones:
          'Reposicion por falta de stock detectada en produccion y servicio.',
        items: [
          expect.objectContaining({
            recetaId: 'receta-1',
            cantidadAProducir: 1,
          }),
          expect.objectContaining({
            recetaId: 'receta-2',
            cantidadAProducir: 1.5,
          }),
        ],
      })
    );
  });

  it('builds canonical payloads for pedido-usuarios/from-recipes', () => {
    const context = createContext({
      seedCreatedRecetaIds: ['receta-1', 'receta-2', 'receta-3'],
    });

    const body = buildBodyOrdersAndReception(
      createEnv(context, {
        endpoint: {
          method: 'POST',
          path: '/pedido-usuarios/from-recipes',
          source: 'spec',
        },
        resolvedPath: '/pedido-usuarios/from-recipes',
        templatePath: '/pedido-usuarios/from-recipes',
      })
    );

    expect(body).toEqual(
      expect.objectContaining({
        recetaIds: ['receta-1', 'receta-2', 'receta-3'],
        observaciones:
          'Generacion agrupada desde varias recetas para validar reparto por proveedor.',
      })
    );
  });

  it('builds pedidos with several lines from the same provider', () => {
    const context = createContext({
      seedCreatedProductoProveedorIds: ['pp-1', 'pp-2', 'pp-3', 'pp-4'],
      seedCreatedProductoProveedorToProveedorPairs: [
        'pp-1|prov-1',
        'pp-2|prov-1',
        'pp-3|prov-1',
        'pp-4|prov-2',
      ],
      seedCreatedProductoProveedorToProductoPairs: [
        'pp-1|prod-1',
        'pp-2|prod-2',
        'pp-3|prod-3',
        'pp-4|prod-4',
      ],
    });

    const body = buildBodyOrdersAndReception(
      createEnv(context, {
        endpoint: {
          method: 'POST',
          path: '/pedidos',
          source: 'spec',
        },
        resolvedPath: '/pedidos',
        templatePath: '/pedidos',
        proveedorId: 'prov-1',
        productoProveedorId: 'pp-1',
      })
    ) as {
      proveedorId: string;
      lineas: Array<{ productoProveedorId: string }>;
    };

    expect(body.proveedorId).toBe('prov-1');
    expect(body.lineas.length).toBeGreaterThan(1);
    expect(
      body.lineas.every((linea) =>
        ['pp-1', 'pp-2', 'pp-3'].includes(linea.productoProveedorId)
      )
    ).toBe(true);
  });

  it('builds grouped pedidos with multiple providers and several product lines', () => {
    const context = createContext({
      seedCreatedProductoProveedorIds: [
        'pp-1',
        'pp-2',
        'pp-3',
        'pp-4',
        'pp-5',
        'pp-6',
      ],
      seedCreatedProductoProveedorToProveedorPairs: [
        'pp-1|prov-1',
        'pp-2|prov-1',
        'pp-3|prov-2',
        'pp-4|prov-2',
        'pp-5|prov-3',
        'pp-6|prov-3',
      ],
      seedCreatedProductoProveedorToProductoPairs: [
        'pp-1|prod-1',
        'pp-2|prod-2',
        'pp-3|prod-3',
        'pp-4|prod-4',
        'pp-5|prod-5',
        'pp-6|prod-6',
      ],
    });

    const body = buildBodyOrdersAndReception(
      createEnv(context, {
        endpoint: {
          method: 'POST',
          path: '/pedido-usuarios',
          source: 'spec',
        },
        resolvedPath: '/pedido-usuarios',
        templatePath: '/pedido-usuarios',
        productoProveedorId: 'pp-1',
      })
    ) as { lineas: Array<{ productoProveedorId: string }> };

    expect(body.lineas.length).toBeGreaterThan(3);
    expect(
      new Set(body.lineas.map((linea) => linea.productoProveedorId)).size
    ).toBe(body.lineas.length);
  });

  it('cancelar body uses deterministic motivo cancelacion', () => {
    const context = createContext({});

    const body = buildBodyOrdersAndReception(
      createEnv(context, {
        endpoint: {
          method: 'PATCH',
          path: '/pedidos/some-id/cancelar',
          source: 'spec',
        },
        resolvedPath: '/pedidos/some-id/cancelar',
        templatePath: '/pedidos/:id/cancelar',
      })
    ) as { motivoCancelacion: string };

    expect(body.motivoCancelacion).toBe(
      'Proveedor comunica retraso superior a 7 dias. Se cancela y se renegocia para el siguiente ciclo.'
    );
  });

  it('cancelar body rotates motivo by iteration', () => {
    const context = createContext({});

    const body2 = buildBodyOrdersAndReception(
      createEnv(context, {
        endpoint: {
          method: 'PATCH',
          path: '/pedidos/some-id/cancelar',
          source: 'spec',
        },
        resolvedPath: '/pedidos/some-id/cancelar',
        templatePath: '/pedidos/:id/cancelar',
        iteration: 2,
      })
    ) as { motivoCancelacion: string };

    expect(body2.motivoCancelacion).toBe(
      'Error en la cantidad solicitada detectado tras la aprobacion. Se rehace el pedido correcto.'
    );
  });

  it('fecha-entrega body includes fechaEntrega aligned with seed contract', () => {
    const context = createContext({});

    const body = buildBodyOrdersAndReception(
      createEnv(context, {
        endpoint: {
          method: 'PATCH',
          path: '/pedidos/some-id/fecha-entrega',
          source: 'spec',
        },
        resolvedPath: '/pedidos/some-id/fecha-entrega',
        templatePath: '/pedidos/:id/fecha-entrega',
      })
    );

    expect(body).toEqual({
      fechaEntrega: '2026-01-19T08:00:00.000Z',
    });
  });

  it('recepciones body uses fixed fecha and albaran by iteration', () => {
    const context = createContext({
      pedidoReceivableIds: ['pedido-rx-1'],
      pedidoProductoIds: ['pp-rx-1'],
    });

    const body = buildBodyOrdersAndReception(
      createEnv(context, {
        endpoint: { method: 'POST', path: '/recepciones', source: 'spec' },
        resolvedPath: '/recepciones',
        templatePath: '/recepciones',
        coverage: createEnumCoverage(),
        estadoProducto: '',
        usuarioId: 'user-seed-1',
        pedidoProductoId: 'pp-rx-1',
      })
    ) as {
      nAlbaran: string;
      fechaRecepcion: string;
      pedidos: Array<{ pedidoId: string; nAlbaran: string }>;
    };

    expect(body.nAlbaran).toBe('ALB-S1-000');
    expect(body.fechaRecepcion).toBe('2026-01-05T08:00:00.000Z');
    expect(body.pedidos[0]?.nAlbaran).toBe('ALB-S1-000');
  });

  it('recepciones albaranes advance to next week at iteration 5', () => {
    const context = createContext({
      pedidoReceivableIds: ['pedido-rx-2'],
      pedidoProductoIds: ['pp-rx-2'],
    });

    const body = buildBodyOrdersAndReception(
      createEnv(context, {
        endpoint: { method: 'POST', path: '/recepciones', source: 'spec' },
        resolvedPath: '/recepciones',
        templatePath: '/recepciones',
        coverage: createEnumCoverage(),
        estadoProducto: '',
        usuarioId: 'user-seed-1',
        pedidoProductoId: 'pp-rx-2',
        iteration: 5,
      })
    ) as { nAlbaran: string; fechaRecepcion: string };

    expect(body.nAlbaran).toBe('ALB-S2-005');
    expect(body.fechaRecepcion).toBe('2026-01-12T08:00:00.000Z');
  });

  it('pedido observaciones rotate deterministically by iteration', () => {
    const context = createContext({
      seedCreatedProductoProveedorIds: ['pp-1'],
      seedCreatedProductoProveedorToProveedorPairs: ['pp-1|prov-1'],
      seedCreatedProductoProveedorToProductoPairs: ['pp-1|prod-1'],
    });

    const makeBody = (iteration: number) =>
      buildBodyOrdersAndReception(
        createEnv(context, {
          endpoint: { method: 'POST', path: '/pedidos', source: 'spec' },
          resolvedPath: '/pedidos',
          templatePath: '/pedidos',
          proveedorId: 'prov-1',
          productoProveedorId: 'pp-1',
          iteration,
        })
      ) as { observaciones: string };

    expect(makeBody(0).observaciones).toBe(
      'Reposicion urgente para cubrir produccion de la proxima semana.'
    );
    expect(makeBody(1).observaciones).toBe(
      'Pedido programado segun planificacion mensual de compras.'
    );
    expect(makeBody(2).observaciones).toBe(
      'Compra puntual para evento especial del comedor.'
    );

    expect(makeBody(5).observaciones).toBe(makeBody(0).observaciones);
  });
});
