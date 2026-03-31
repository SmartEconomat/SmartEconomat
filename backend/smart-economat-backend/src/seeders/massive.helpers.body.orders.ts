import { faker } from '@faker-js/faker';
import { PRODUCT_TYPES, PRODUCT_UNITS } from './massive.config';
import { markEnum } from './massive.helpers.common';
import { BuildBodyEnv } from './massive.helpers.body.shared';
import { getStateArray, pickRequiredStateValue } from './massive.state';

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
    pedidoId,
    pedidoProductoId,
    recepcionId,
    estadoProducto,
  } = env;

  if (resolvedPath === '/pedido/draft') {
    return {
      payload: {
        nombre: `Draft pedido ${suffix}`,
        nota: faker.lorem.sentence(),
        lineas: [
          {
            productoProveedorId,
            cantidad: Number(
              faker.number.float({ min: 0.5, max: 5, fractionDigits: 2 })
            ),
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
        nota: faker.lorem.sentence(),
      },
    };
  }

  if (resolvedPath === '/pedidos/from-recipes') {
    const recetaIds = [
      getStateArray(context, 'seedCreatedRecetaIds')[0] ||
        recetaId ||
        pickRequiredStateValue(context, 'recetaIds', iteration),
    ];

    return {
      recetaIds,
      observaciones: faker.lorem.sentence(),
    };
  }

  if (
    resolvedPath === '/pedidos' ||
    resolvedPath === '/pedido-usuarios' ||
    resolvedPath === '/purchase-batches'
  ) {
    let lineProductoProveedorId = productoProveedorId;

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
        lineProductoProveedorId =
          matchingProductoProveedorIds[
            iteration % matchingProductoProveedorIds.length
          ];
      }
    }

    const line = {
      productoProveedorId: lineProductoProveedorId,
      cantidad: Number(
        faker.number.float({ min: 0.5, max: 8, fractionDigits: 2 })
      ),
    };

    if (resolvedPath === '/pedidos') {
      return {
        proveedorId,
        observaciones: `Generado por seed ${suffix}`,
        lineas: [line],
      };
    }

    return {
      observaciones: `Generado por seed ${suffix}`,
      lineas: [line],
    };
  }

  if (
    endpoint.method === 'PATCH' &&
    (templatePath === '/pedidos/:id' ||
      templatePath === '/pedido-usuarios/:id' ||
      templatePath === '/purchase-batches/:id')
  ) {
    const line = {
      productoProveedorId,
      cantidad: Number(
        faker.number.float({ min: 0.5, max: 4, fractionDigits: 2 })
      ),
    };

    if (templatePath === '/pedidos/:id') {
      return {
        observaciones: `Actualizado por seed ${suffix}`,
      };
    }

    return {
      observaciones: `Actualizado por seed ${suffix}`,
      lineas: [line],
    };
  }

  if (templatePath === '/pedidos/:id/fecha-entrega') {
    return {
      observaciones: `No-op seed ${suffix}`,
    };
  }

  if (resolvedPath === '/purchase-batches/consolidate') {
    const pendingPedidoUsuarioIds =
      getStateArray(context, 'seedCreatedPedidoUsuarioPendienteIds').length > 0
        ? getStateArray(context, 'seedCreatedPedidoUsuarioPendienteIds')
        : getStateArray(context, 'pedidoUsuarioPendienteIds');

    const selectedPedidoUsuarioId =
      pendingPedidoUsuarioIds[pendingPedidoUsuarioIds.length - 1] ||
      pickRequiredStateValue(context, 'pedidoUsuarioPendienteIds', iteration);

    const selectedPedidoUsuarioIds = [selectedPedidoUsuarioId];

    return {
      pedidoIds: selectedPedidoUsuarioIds,
      pedidoUsuarioIds: selectedPedidoUsuarioIds,
      observaciones: faker.lorem.sentence(),
    };
  }

  if (resolvedPath === '/purchase-batches/from-missing-stock') {
    const seedRecipeIds =
      getStateArray(context, 'seedCreatedRecetaIds').length > 0
        ? getStateArray(context, 'seedCreatedRecetaIds')
        : getStateArray(context, 'recetaIds');

    const recetaIdsForMissingStock = Array.from(
      new Set([recetaId, ...seedRecipeIds].filter(Boolean))
    ).slice(0, 3);

    const items = recetaIdsForMissingStock.map((selectedRecetaId, index) => ({
      recetaId: selectedRecetaId,
      cantidad: Number((80 + ((iteration + index) % 5) * 25).toFixed(2)),
    }));

    return {
      items,
      observaciones: faker.lorem.sentence(),
    };
  }

  if (resolvedPath === '/purchase-batches/from-recipes') {
    const recetaIds = [
      getStateArray(context, 'seedCreatedRecetaIds')[0] ||
        recetaId ||
        pickRequiredStateValue(context, 'recetaIds', iteration),
    ];

    return {
      recetaIds,
      observaciones: faker.lorem.sentence(),
    };
  }

  if (resolvedPath.endsWith('/cancelar')) {
    return { motivoCancelacion: faker.lorem.sentence() };
  }

  if (resolvedPath === '/recepciones') {
    const unidadNuevo = PRODUCT_UNITS[(iteration + 1) % PRODUCT_UNITS.length];
    const tipoNuevo = PRODUCT_TYPES[(iteration + 1) % PRODUCT_TYPES.length];

    markEnum(coverage, 'productUnits', unidadNuevo);
    markEnum(coverage, 'productTypes', tipoNuevo);

    return {
      pedidoIds: [pedidoId],
      nAlbaran: `ALB-${faker.string.alphanumeric(8).toUpperCase()}`,
      observaciones: faker.lorem.sentence(),

      productos: [],
      productosNuevos: [
        {
          pendienteCreacion: true,
          codigoBarras: `NUEVO-${suffix}`,
          nombre: faker.commerce.productName(),
          marca: faker.company.name(),
          unidad: unidadNuevo,
          tipo: tipoNuevo,
          contenido: Number(
            faker.number.float({ min: 0.3, max: 10, fractionDigits: 2 })
          ),
          cantidadRecibida: Number(
            faker.number.float({ min: 0.5, max: 4, fractionDigits: 2 })
          ),
          observaciones: faker.lorem.sentence(),
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
      cantidadRecibida: Number(
        faker.number.float({ min: 0.5, max: 6, fractionDigits: 2 })
      ),
      estadoProducto,
      observaciones: faker.lorem.sentence(),
    };
  }

  return undefined;
}
