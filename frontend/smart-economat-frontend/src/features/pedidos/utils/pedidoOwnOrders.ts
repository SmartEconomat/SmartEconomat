import {
  PedidoListItem,
  PedidoUsuarioRow,
} from '../../../services/pedido.types';

export const isPedidoUsuarioRow = (
  pedido: PedidoListItem
): pedido is PedidoUsuarioRow => pedido.entityType === 'pedido_usuario';

export const getPedidoUsuarioSelectionIds = (
  pedido: PedidoListItem
): string[] => (isPedidoUsuarioRow(pedido) ? [pedido.pedidoUsuarioId] : []);
