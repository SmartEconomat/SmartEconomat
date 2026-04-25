import {
  PedidoListItem,
  PedidoUsuarioRow,
} from '../../../services/pedido.types';

/**
 * @description Type guard that narrows a PedidoListItem to a PedidoUsuarioRow.
 * @param pedido - Any item from the pedidos list
 * @returns True when the item is a user-visible pedido (entityType === 'pedido_usuario')
 */
export const isPedidoUsuarioRow = (
  pedido: PedidoListItem
): pedido is PedidoUsuarioRow => pedido.entityType === 'pedido_usuario';

/**
 * @description Returns the pedidoUsuarioId wrapped in an array for selection logic, or an empty array for non-user orders.
 * @param pedido - Any item from the pedidos list
 * @returns Array with a single pedidoUsuarioId, or an empty array for internal pedidos
 */
export const getPedidoUsuarioSelectionIds = (
  pedido: PedidoListItem
): string[] => (isPedidoUsuarioRow(pedido) ? [pedido.pedidoUsuarioId] : []);
