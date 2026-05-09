import { EstadoPedidoUsuario } from '../enums/estado-pedido-usuario.enum';

type ConsolidationOrderLike = {
  estado: EstadoPedidoUsuario;
  pedidos?: Array<{
    batchId?: string | null;
    recepcionesPedido?: unknown[];
  }>;
};

type ConsolidationDecision = {
  allowed: boolean;
  reason?: string;
  requiresAutoApproval?: boolean;
};

export function canApprove(order: ConsolidationOrderLike): boolean {
  return (
    order.estado === EstadoPedidoUsuario.PENDIENTE &&
    !isConsolidated(order) &&
    !hasRecepciones(order)
  );
}

export function canConsolidate(
  order: ConsolidationOrderLike,
  options?: { autoApprovePending?: boolean }
): ConsolidationDecision {
  if (isConsolidated(order)) {
    return { allowed: false, reason: 'order.alreadyConsolidated' };
  }

  if (hasRecepciones(order)) {
    return { allowed: false, reason: 'order.hasRecepciones' };
  }

  if (order.estado === EstadoPedidoUsuario.CANCELADO) {
    return { allowed: false, reason: 'order.cancelled' };
  }

  if (order.estado === EstadoPedidoUsuario.PENDIENTE) {
    if (options?.autoApprovePending) {
      return { allowed: true, requiresAutoApproval: true };
    }
    return { allowed: false, reason: 'order.pendingRequiresAutoApproval' };
  }

  return { allowed: order.estado === EstadoPedidoUsuario.APROBADO };
}

export function canConsolidateWeek(
  week: { orders: ConsolidationOrderLike[] },
  options?: { autoApprovePending?: boolean }
): ConsolidationDecision {
  if (!week.orders.length) {
    return { allowed: false, reason: 'week.empty' };
  }

  for (const order of week.orders) {
    const decision = canConsolidate(order, options);
    if (!decision.allowed) {
      return decision;
    }
  }

  return { allowed: true };
}

function isConsolidated(order: ConsolidationOrderLike): boolean {
  return order.estado === EstadoPedidoUsuario.CONSOLIDADO;
}

function hasRecepciones(order: ConsolidationOrderLike): boolean {
  return (order.pedidos || []).some(
    (pedido) => (pedido.recepcionesPedido || []).length > 0
  );
}
