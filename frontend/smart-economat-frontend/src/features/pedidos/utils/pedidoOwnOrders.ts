import {
  EstadoLote,
  EstadoPedido,
  Pedido,
  PurchaseBatch,
} from '../../../services/pedido.types';

export const isAggregatedBatchPedido = (pedido: Pedido): boolean =>
  Boolean(
    pedido.aggregateType === 'pedido_usuario' ||
    (pedido.batchId &&
      pedido.batch?.pedidos?.length &&
      pedido.id === pedido.batchId)
  );

export const getAggregatedPedidoSourceIds = (pedido: Pedido): string[] =>
  pedido.aggregateType === 'pedido_usuario'
    ? [pedido.pedidoUsuarioId || pedido.id]
    : isAggregatedBatchPedido(pedido)
      ? (pedido.batch?.pedidos || []).map((batchPedido) => batchPedido.id)
      : [pedido.id];

const deriveAggregatedEstado = (pedidos: Pedido[]): EstadoPedido => {
  const states = Array.from(new Set(pedidos.map((pedido) => pedido.estado)));

  if (states.length === 1) {
    return states[0];
  }

  const hasOnlyActiveStates = states.every(
    (state) =>
      state === EstadoPedido.PENDIENTE || state === EstadoPedido.EN_PROCESO
  );

  if (hasOnlyActiveStates) {
    return EstadoPedido.EN_PROCESO;
  }

  return EstadoPedido.PARCIAL;
};

const mapPedidoEstadoToBatchEstado = (estado: EstadoPedido): EstadoLote => {
  switch (estado) {
    case EstadoPedido.PENDIENTE:
      return EstadoLote.PENDIENTE;
    case EstadoPedido.EN_PROCESO:
    case EstadoPedido.PARCIAL:
      return EstadoLote.PARCIAL;
    default:
      return EstadoLote.COMPLETADO;
  }
};

const buildProvidersSummary = (pedidos: Pedido[]): string => {
  const providerNames = Array.from(
    new Set(pedidos.map((pedido) => pedido.proveedor?.nombre).filter(Boolean))
  ) as string[];

  if (providerNames.length === 0) return '—';
  if (providerNames.length <= 2) return providerNames.join(', ');
  return `${providerNames.length} proveedores`;
};

export const consolidateOwnPedidos = (pedidos: Pedido[]): Pedido[] => {
  const grouped = new Map<string, Pedido[]>();
  const standalone: Pedido[] = [];

  pedidos.forEach((pedido) => {
    if (!pedido.batchId) {
      standalone.push(pedido);
      return;
    }

    if (!grouped.has(pedido.batchId)) {
      grouped.set(pedido.batchId, []);
    }

    grouped.get(pedido.batchId)?.push(pedido);
  });

  const aggregated = Array.from(grouped.entries()).map(
    ([batchId, batchPedidos]) => {
      const firstPedido = batchPedidos[0];
      const aggregatedEstado = deriveAggregatedEstado(batchPedidos);
      const batch: PurchaseBatch = {
        id: batchId,
        createdAt: firstPedido.fechaPedido,
        estado: mapPedidoEstadoToBatchEstado(aggregatedEstado),
        observaciones: firstPedido.observaciones,
        usuario: firstPedido.usuario,
        isAprobado: aggregatedEstado !== EstadoPedido.PENDIENTE,
        pedidos: batchPedidos,
      };

      return {
        ...firstPedido,
        id: batchId,
        batchId,
        batch,
        proveedor: {
          id: batchId,
          nombre: buildProvidersSummary(batchPedidos),
        },
        costeTotal: batchPedidos.reduce(
          (sum, pedido) => sum + Number(pedido.costeTotal || 0),
          0
        ),
        estado: aggregatedEstado,
        pedidoProductos: batchPedidos.flatMap(
          (pedido) => pedido.pedidoProductos || []
        ),
      } satisfies Pedido;
    }
  );

  return [...aggregated, ...standalone].sort(
    (left, right) =>
      new Date(right.fechaPedido).getTime() -
      new Date(left.fechaPedido).getTime()
  );
};
