import {
  PedidoListItem,
  PedidoUsuarioRow,
} from '../../../services/pedido.types';

/**
 * Documentación en español.
 */
export const isPedidoUsuarioRow = (
  pedido: PedidoListItem
): pedido is PedidoUsuarioRow => pedido.entityType === 'pedido_usuario';

/**
 * Documentación en español.
 */
export const getPedidoUsuarioSelectionIds = (
  pedido: PedidoListItem
): string[] => (isPedidoUsuarioRow(pedido) ? [pedido.pedidoUsuarioId] : []);
