import { PRODUCT_TYPES, PRODUCT_UNITS } from './massive.config';
import { markEnum } from './massive.helpers.common';
import { BuildBodyEnv } from './massive.helpers.body.shared';
import { getStateArray, pickRequiredStateValue } from './massive.state';

const SEED_BASE_FECHA = new Date('2026-01-05T08:00:00.000Z');

/**
 * Ejecuta la lógica de seed date dentro del flujo de la aplicación.
 *
 * @param daysOffset Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
 */
function seedDate(daysOffset: number): string {
  return new Date(
    SEED_BASE_FECHA.getTime() + daysOffset * 24 * 60 * 60 * 1000
  ).toISOString();
}

/**
 * Ejecuta la lógica de seed week offset dentro del flujo de la aplicación.
 *
 * @param iteration Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
 */
function seedWeekOffset(iteration: number): number {
  return Math.floor(iteration / 5) * 7;
}

const CANCELACION_MOTIVOS = [
  'Proveedor comunica retraso superior a 7 dias. Se cancela y se renegocia para el siguiente ciclo.',
  'Producto descatalogado por el proveedor. Pendiente de buscar alternativa.',
  'Error en la cantidad solicitada detectado tras la aprobacion. Se rehace el pedido correcto.',
  'Cambio de proveedor aprobado por direccion. Pedido anulado y reasignado.',
  'Pedido duplicado por error del sistema. Se conserva solo la version posterior.',
] as const;

const RECEPCION_OBSERVACIONES = [
  'Mercancia recibida conforme al albaran. Todo en orden.',
  'Recepcion con pequenas discrepancias de peso dentro de margen tolerado.',
  'Entrega completa. Palets en buen estado. Temperatura de cadena fria correcta.',
  'Algunos envases presentan golpes leves sin afectar al producto interior.',
  'Recepcion OK. Fechas de caducidad revisadas y conformes.',
] as const;

const RECEPCION_INCIDENCIA_DESCRIPCIONES = [
  'Falta de producto: se recibieron menos unidades de las pedidas.',
  'Producto en mal estado al abrir el embalaje exterior.',
  'Fecha de caducidad inferior a la minima acordada con el proveedor.',
] as const;

const ESTADO_OBSERVACIONES = [
  'Reposicion urgente para cubrir produccion de la proxima semana.',
  'Pedido programado segun planificacion mensual de compras.',
  'Compra puntual para evento especial del comedor.',
  'Reposicion de stock minimo alcanzado en varios productos.',
  'Pedido de prueba con nuevo proveedor para evaluacion.',
] as const;

const PRODUCTO_NUEVO_NOMBRES = [
  'Aceite de oliva virgen extra',
  'Harina de trigo tipo 550',
  'Mantequilla sin sal',
  'Azucar blanquilla',
  'Leche entera UHT',
] as const;

const PRODUCTO_NUEVO_MARCAS = [
  'La Española',
  'Harinera Villamayor',
  'Président',
  'Azucarera',
  'Asturiana',
] as const;

const CANTIDADES_RECIBIDAS = [2, 3, 5, 8, 4, 6, 1, 5] as const;

const CADUCIDAD_DIAS_EXTRA = [60, 75, 45, 90, 120, 50, 80, 100] as const;

const CONTENIDO_PRODUCTOS_NUEVOS = [1, 0.5, 5, 2, 10] as const;

type PedidoSeedLine = {
  productoProveedorId: string;
  proveedorId: string;
  productoId: string;
};

type PedidoPerfil = {
  observaciones: string;
  proveedoresObjetivo: number;
  lineasPorProveedor: number;
};

const PEDIDO_PERFILES: readonly PedidoPerfil[] = [
  {
    observaciones:
      'Reposicion semanal de cocina con producto seco, refrigerado y apoyo de frescos.',
    proveedoresObjetivo: 3,
    lineasPorProveedor: 2,
  },
  {
    observaciones:
      'Compra para menu completo con base de secos y refuerzo de frescos.',
    proveedoresObjetivo: 2,
    lineasPorProveedor: 3,
  },
  {
    observaciones:
      'Pedido mixto para produccion, linea fria y servicio de comedor.',
    proveedoresObjetivo: 3,
    lineasPorProveedor: 2,
  },
] as const;

function buildProductoProveedorRecords(
  context: BuildBodyEnv['context'],
  fallbackProductoProveedorId: string,
  allowedProductoProveedorIds?: string[]
): PedidoSeedLine[] {
  const providerPairs = [
    ...getStateArray(context, 'seedCreatedProductoProveedorToProveedorPairs'),
    ...getStateArray(context, 'productoProveedorToProveedorPairs'),
  ];
  const productPairs = [
    ...getStateArray(context, 'seedCreatedProductoProveedorToProductoPairs'),
    ...getStateArray(context, 'productoProveedorToProductoPairs'),
  ];

  const providerByProductoProveedorId = new Map<string, string>();
  for (const pair of providerPairs) {
    const [productoProveedorId, proveedorId] = pair.split('|');
    if (productoProveedorId && proveedorId) {
      providerByProductoProveedorId.set(productoProveedorId, proveedorId);
    }
  }

  const productByProductoProveedorId = new Map<string, string>();
  for (const pair of productPairs) {
    const [productoProveedorId, productoId] = pair.split('|');
    if (productoProveedorId && productoId) {
      productByProductoProveedorId.set(productoProveedorId, productoId);
    }
  }

  const preferredProductoProveedorIds =
    allowedProductoProveedorIds && allowedProductoProveedorIds.length > 0
      ? allowedProductoProveedorIds
      : [
          ...getStateArray(context, 'seedCreatedProductoProveedorIds'),
          ...getStateArray(context, 'productoProveedorIds'),
          fallbackProductoProveedorId,
        ];

  return Array.from(new Set(preferredProductoProveedorIds))
    .filter(Boolean)
    .map((productoProveedorId) => ({
      productoProveedorId,
      proveedorId: providerByProductoProveedorId.get(productoProveedorId) || '',
      productoId:
        productByProductoProveedorId.get(productoProveedorId) ||
        productoProveedorId,
    }))
    .filter(
      (record) =>
        record.productoProveedorId.length > 0 && record.proveedorId.length > 0
    );
}

function buildCantidadPedido(
  iteration: number,
  providerIndex: number,
  lineIndex: number
): number {
  const cantidades = [1, 2, 3, 4, 6, 8, 10, 12];
  return (
    cantidades[(iteration + providerIndex + lineIndex) % cantidades.length] || 1
  );
}

function buildPedidoLineas(
  context: BuildBodyEnv['context'],
  productoProveedorId: string,
  iteration: number,
  maxItems: number,
  allowedProductoProveedorIds?: string[],
  providerLimit = 1
): Array<Record<string, unknown>> {
  const perfil = PEDIDO_PERFILES[iteration % PEDIDO_PERFILES.length];
  const productoProveedorRecords = buildProductoProveedorRecords(
    context,
    productoProveedorId,
    allowedProductoProveedorIds
  );
  const recordsByProvider = new Map<string, PedidoSeedLine[]>();

  for (const record of productoProveedorRecords) {
    const current = recordsByProvider.get(record.proveedorId) ?? [];
    current.push(record);
    recordsByProvider.set(record.proveedorId, current);
  }

  const selectedProviderIds = Array.from(recordsByProvider.keys()).slice(
    0,
    Math.max(
      1,
      Math.min(
        providerLimit,
        perfil.proveedoresObjetivo,
        recordsByProvider.size
      )
    )
  );
  const lineas: Array<Record<string, unknown>> = [];
  const usedProductoIds = new Set<string>();

  selectedProviderIds.forEach((selectedProviderId, providerIndex) => {
    const providerRecords = recordsByProvider.get(selectedProviderId) ?? [];
    const uniqueProviderRecords = providerRecords.filter((record) => {
      if (usedProductoIds.has(record.productoId)) {
        return false;
      }

      usedProductoIds.add(record.productoId);
      return true;
    });

    uniqueProviderRecords
      .slice(0, Math.min(perfil.lineasPorProveedor, maxItems))
      .forEach((selectedRecord, lineIndex) => {
        lineas.push({
          productoProveedorId: selectedRecord.productoProveedorId,
          cantidad: buildCantidadPedido(iteration, providerIndex, lineIndex),
        });
      });
  });

  return lineas.slice(0, maxItems);
}

function resolvePedidoProductoForRecepcion(
  context: BuildBodyEnv['context'],
  selectedPedidoId: string,
  fallbackPedidoProductoId: string,
  iteration: number
): string {
  const freshPairs = getStateArray(context, 'pedidoProductoToPedidoPairsFresh');
  const storedPairs = getStateArray(context, 'pedidoProductoToPedidoPairs');
  const pairs = [...freshPairs, ...storedPairs]
    .map((pair) => pair.split('|'))
    .filter(
      (parts) =>
        parts.length === 2 &&
        parts[1] === selectedPedidoId &&
        typeof parts[0] === 'string' &&
        parts[0].length > 0
    )
    .map((parts) => parts[0]);

  if (pairs.length === 0) {
    return fallbackPedidoProductoId;
  }

  return pairs[iteration % pairs.length] || fallbackPedidoProductoId;
}

/**
 * Expone "buildBodyOrdersAndReception" en smart-economat-backend (Nest).
 * @undefined {BuildBodyEnv} env - Entrada efectiva esperada por el contrato.
 * @undefined {Record<string, unknown> | undefined} Datos efectivos después de ejecutar la operación.
 */
export function buildBodyOrdersAndReception(
  env: BuildBodyEnv
): Record<string, unknown> | undefined {
  const {
    context,
    endpoint,
    resolvedPath,
    templatePath,
    iteration,
    coverage,
    suffix,
    productoProveedorId,
    proveedorId,
    recetaId,
    pedidoProductoId,
    recepcionId,
    estadoProducto,
    usuarioId,
  } = env;

  if (resolvedPath === '/pedido/draft') {
    return {
      payload: {
        nombre: `Draft pedido ${suffix}`,
        nota: 'Borrador de pedido en progreso. Pendiente de revision antes de envio.',
        lineas: [
          {
            productoProveedorId,
            cantidad:
              CANTIDADES_RECIBIDAS[iteration % CANTIDADES_RECIBIDAS.length],
          },
        ],
      },
    };
  }

  if (resolvedPath === '/pedido/draft/finalize') {
    return {};
  }

  if (resolvedPath === '/recepcion/draft') {
    return {
      payload: {
        nombre: `Draft recepcion ${suffix}`,
        nota: 'Borrador de recepcion en progreso. Pendiente de completar.',
      },
    };
  }

  if (
    resolvedPath === '/pedidos/from-recipes' ||
    resolvedPath === '/pedido-usuarios/from-recipes' ||
    resolvedPath === '/purchase-batches/from-recipes'
  ) {
    const availableRecetaIds = Array.from(
      new Set(
        [
          ...getStateArray(context, 'seedCreatedRecetaIds'),
          ...getStateArray(context, 'recetaIds'),
          recetaId,
        ].filter(Boolean)
      )
    );
    const recetaIds =
      resolvedPath === '/pedidos/from-recipes'
        ? availableRecetaIds.slice(0, 1)
        : availableRecetaIds.slice(0, 3);

    return {
      recetaIds,
      observaciones:
        resolvedPath === '/pedidos/from-recipes'
          ? 'Generacion de pedido directo desde receta base para servicio.'
          : 'Generacion agrupada desde varias recetas para validar reparto por proveedor.',
    };
  }

  if (
    resolvedPath === '/pedidos' ||
    resolvedPath === '/pedido-usuarios' ||
    resolvedPath === '/purchase-batches'
  ) {
    let lineProductoProveedorId = productoProveedorId;
    let allowedProductoProveedorIds: string[] | undefined;

    if (resolvedPath === '/pedidos' && proveedorId) {
      const createdPairs = getStateArray(
        context,
        'seedCreatedProductoProveedorToProveedorPairs'
      );
      const pairs =
        createdPairs.length > 0
          ? createdPairs
          : getStateArray(context, 'productoProveedorToProveedorPairs');
      const matchingProductoProveedorIds = pairs
        .map((pair) => pair.split('|'))
        .filter(
          (parts) => parts.length === 2 && parts[1] === proveedorId && parts[0]
        )
        .map((parts) => parts[0]);

      if (matchingProductoProveedorIds.length > 0) {
        allowedProductoProveedorIds = matchingProductoProveedorIds;
        lineProductoProveedorId =
          matchingProductoProveedorIds[
            iteration % matchingProductoProveedorIds.length
          ];
      }
    }

    const lineas = buildPedidoLineas(
      context,
      lineProductoProveedorId,
      iteration,
      resolvedPath === '/pedidos' ? 5 : 8,
      resolvedPath === '/pedidos' ? allowedProductoProveedorIds : undefined,
      resolvedPath === '/pedidos'
        ? 1
        : PEDIDO_PERFILES[iteration % PEDIDO_PERFILES.length]
            .proveedoresObjetivo
    );

    if (resolvedPath === '/pedidos') {
      return {
        proveedorId,
        observaciones:
          ESTADO_OBSERVACIONES[iteration % ESTADO_OBSERVACIONES.length],
        lineas,
      };
    }

    return {
      observaciones:
        PEDIDO_PERFILES[iteration % PEDIDO_PERFILES.length].observaciones,
      lineas,
    };
  }

  if (
    endpoint.method === 'PATCH' &&
    (templatePath === '/pedidos/:id' ||
      templatePath === '/pedido-usuarios/:id' ||
      templatePath === '/purchase-batches/:id')
  ) {
    const lineas = buildPedidoLineas(
      context,
      productoProveedorId,
      iteration,
      2
    );

    if (templatePath === '/pedidos/:id') {
      return {
        observaciones: `Actualizado por seed ${suffix}`,
      };
    }

    return {
      observaciones: `Actualizado por seed ${suffix}`,
      lineas,
    };
  }

  if (templatePath === '/pedidos/:id/fecha-entrega') {
    return {};
  }

  if (resolvedPath === '/purchase-batches/consolidate') {
    const forcedConsolidatePedidoUsuarioIds = Array.from(
      new Set(getStateArray(context, 'seedConsolidatePedidoUsuarioIds'))
    ).filter(Boolean);

    if (forcedConsolidatePedidoUsuarioIds.length > 0) {
      return {
        pedidoUsuarioIds: forcedConsolidatePedidoUsuarioIds,
        observaciones:
          'Consolidacion de lotes pendientes de usuario para el periodo actual.',
        autoApprovePending: true,
      };
    }

    const pendingPedidoUsuarioIds =
      getStateArray(context, 'seedCreatedPedidoUsuarioPendienteIds').length > 0
        ? getStateArray(context, 'seedCreatedPedidoUsuarioPendienteIds')
        : getStateArray(context, 'pedidoUsuarioPendienteIds');

    const selectedPedidoUsuarioId =
      pendingPedidoUsuarioIds[pendingPedidoUsuarioIds.length - 1] ||
      pickRequiredStateValue(context, 'pedidoUsuarioPendienteIds', iteration);

    return {
      pedidoUsuarioIds: [selectedPedidoUsuarioId],
      observaciones:
        'Consolidacion de pedidos de usuario pendientes por proveedor.',
      autoApprovePending: true,
    };
  }

  if (
    resolvedPath === '/purchase-batches/from-missing-stock' ||
    resolvedPath === '/pedido-usuarios/from-missing-stock'
  ) {
    const seedRecipeIds =
      getStateArray(context, 'seedCreatedRecetaIds').length > 0
        ? getStateArray(context, 'seedCreatedRecetaIds')
        : getStateArray(context, 'recetaIds');

    const recetaIdsForMissingStock = Array.from(
      new Set([recetaId, ...seedRecipeIds].filter(Boolean))
    ).slice(0, 3);

    const items = recetaIdsForMissingStock.map((selectedRecetaId, index) => ({
      recetaId: selectedRecetaId,
      cantidadAProducir: ([1, 1.5, 2, 2.5] as const)[(iteration + index) % 4],
    }));

    return {
      items,
      observaciones:
        'Reposicion por falta de stock detectada en produccion y servicio.',
    };
  }

  if (resolvedPath.endsWith('/cancelar')) {
    return {
      motivoCancelacion:
        CANCELACION_MOTIVOS[iteration % CANCELACION_MOTIVOS.length],
    };
  }

  if (resolvedPath === '/recepciones') {
    const unidadNuevo = PRODUCT_UNITS[(iteration + 1) % PRODUCT_UNITS.length];
    const tipoNuevo = PRODUCT_TYPES[(iteration + 1) % PRODUCT_TYPES.length];
    const forcedPedidoId =
      context.getState<string>('seedRecepcionPedidoId') || '';
    const receivablePedidoIds = Array.from(
      new Set([
        ...getStateArray(context, 'seedCreatedPedidoReceivableIds'),
        ...getStateArray(context, 'pedidoReceivableIds'),
      ])
    ).filter(Boolean);
    const selectedPedidoId =
      (forcedPedidoId && receivablePedidoIds.includes(forcedPedidoId)
        ? forcedPedidoId
        : '') ||
      receivablePedidoIds[iteration % receivablePedidoIds.length] ||
      env.pickRequired('pedidoReceivableIds');
    const selectedPedidoProductoId = resolvePedidoProductoForRecepcion(
      context,
      selectedPedidoId,
      pedidoProductoId,
      iteration
    );
    const cantidadRecibidaBase =
      CANTIDADES_RECIBIDAS[iteration % CANTIDADES_RECIBIDAS.length];
    const cantidadRecibida =
      estadoProducto === 'FALTA_TOTAL' ? 0 : cantidadRecibidaBase;
    const cantidadAlbaran =
      estadoProducto === 'FALTA_TOTAL' ? 0 : cantidadRecibida + 1;
    const weekDays = seedWeekOffset(iteration);
    const weekNum = Math.floor(weekDays / 7) + 1;
    const albaranRef = `ALB-S${weekNum}-${String(iteration).padStart(3, '0')}`;

    markEnum(coverage, 'productUnits', unidadNuevo);
    markEnum(coverage, 'productTypes', tipoNuevo);

    return {
      pedidos: [
        {
          pedidoId: selectedPedidoId,
          nAlbaran: albaranRef,
          observaciones:
            RECEPCION_OBSERVACIONES[iteration % RECEPCION_OBSERVACIONES.length],
        },
      ],
      nAlbaran: albaranRef,
      fechaRecepcion: seedDate(weekDays),
      observaciones:
        RECEPCION_OBSERVACIONES[iteration % RECEPCION_OBSERVACIONES.length],
      usuarioId,
      productos: selectedPedidoProductoId
        ? [
            {
              pedidoProductoId: selectedPedidoProductoId,
              cantidadRecibida,
              cantidadAlbaran,
              estadoVisual: env.estadoVisual,
              estadoProducto,
              fechaCaducidad: seedDate(
                weekDays +
                  CADUCIDAD_DIAS_EXTRA[iteration % CADUCIDAD_DIAS_EXTRA.length]
              ),
              observaciones:
                RECEPCION_OBSERVACIONES[
                  (iteration + 1) % RECEPCION_OBSERVACIONES.length
                ],
              incidenciaDescripcion:
                iteration % 3 === 0
                  ? RECEPCION_INCIDENCIA_DESCRIPCIONES[
                      iteration % RECEPCION_INCIDENCIA_DESCRIPCIONES.length
                    ]
                  : undefined,
              isWeighedWithScale: iteration % 2 === 0,
            },
          ]
        : [],
      productosNuevos: [
        {
          pendienteCreacion: true,
          codigoBarras: `NUEVO-${suffix}`,
          nombre:
            PRODUCTO_NUEVO_NOMBRES[iteration % PRODUCTO_NUEVO_NOMBRES.length],
          marca:
            PRODUCTO_NUEVO_MARCAS[iteration % PRODUCTO_NUEVO_MARCAS.length],
          unidad: unidadNuevo,
          tipo: tipoNuevo,
          contenido:
            CONTENIDO_PRODUCTOS_NUEVOS[
              iteration % CONTENIDO_PRODUCTOS_NUEVOS.length
            ],
          cantidadRecibida:
            CANTIDADES_RECIBIDAS[(iteration + 2) % CANTIDADES_RECIBIDAS.length],
          observaciones:
            RECEPCION_OBSERVACIONES[
              (iteration + 2) % RECEPCION_OBSERVACIONES.length
            ],
          isWeighedWithScale: iteration % 3 === 0,
        },
      ],
    };
  }

  if (templatePath === '/recepciones/:id' && endpoint.method === 'PATCH') {
    return {
      observaciones: `Actualizado por seed ${suffix}`,
    };
  }

  if (resolvedPath.startsWith('/recepcion-productos')) {
    const selectedRecepcionId = recepcionId || env.pickRequired('recepcionIds');
    const freshPedidoProductoIds = getStateArray(
      context,
      'pedidoProductoIdsFresh'
    );
    const latestFreshPedidoProductoId =
      freshPedidoProductoIds.length > 0
        ? freshPedidoProductoIds[
            (freshPedidoProductoIds.length -
              1 -
              (iteration % freshPedidoProductoIds.length) +
              freshPedidoProductoIds.length) %
              freshPedidoProductoIds.length
          ]
        : '';
    let selectedPedidoProductoId =
      latestFreshPedidoProductoId ||
      pedidoProductoId ||
      env.pickRequired('pedidoProductoIds');

    const recepcionPedidoPairs = getStateArray(
      context,
      'recepcionToPedidoPairs'
    )
      .map((pair) => pair.split('|'))
      .filter(
        (parts) =>
          parts.length === 2 &&
          parts[0] === selectedRecepcionId &&
          typeof parts[1] === 'string' &&
          parts[1].length > 0
      );

    if (recepcionPedidoPairs.length > 0) {
      const selectedPedidoId =
        recepcionPedidoPairs[iteration % recepcionPedidoPairs.length]?.[1] ||
        '';

      if (selectedPedidoId) {
        const pedidoProductoPairs = getStateArray(
          context,
          'pedidoProductoToPedidoPairsFresh'
        )
          .map((pair) => pair.split('|'))
          .filter(
            (parts) =>
              parts.length === 2 &&
              parts[1] === selectedPedidoId &&
              typeof parts[0] === 'string' &&
              parts[0].length > 0
          )
          .map((parts) => parts[0]);

        if (pedidoProductoPairs.length > 0) {
          selectedPedidoProductoId =
            pedidoProductoPairs[
              (pedidoProductoPairs.length -
                1 -
                (iteration % pedidoProductoPairs.length) +
                pedidoProductoPairs.length) %
                pedidoProductoPairs.length
            ] || selectedPedidoProductoId;
        }
      }
    }

    return {
      idRecepcion: selectedRecepcionId,
      idPedidoProducto: selectedPedidoProductoId,
      cantidadRecibida:
        CANTIDADES_RECIBIDAS[iteration % CANTIDADES_RECIBIDAS.length],
      estadoProducto,
      observaciones:
        RECEPCION_OBSERVACIONES[iteration % RECEPCION_OBSERVACIONES.length],
    };
  }

  return undefined;
}
