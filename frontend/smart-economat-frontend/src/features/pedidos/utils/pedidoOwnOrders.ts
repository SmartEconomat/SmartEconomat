import {
  PedidoListItem,
  PedidoUsuarioRow,
} from '../../../services/pedido.types';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "isPedidoUsuarioRow" en smart-economat-frontend (SPA).
 * @undefined {PedidoListItem} pedido - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export const isPedidoUsuarioRow = (
  pedido: PedidoListItem
): pedido is PedidoUsuarioRow => pedido.entityType === 'pedido_usuario';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Obtiene valores o vistas materializadas.
 * @undefined {PedidoListItem} pedido - Entrada efectiva esperada por el contrato.
 * @undefined {string[]} Datos efectivos después de ejecutar la operación.
 */
export const getPedidoUsuarioSelectionIds = (
  pedido: PedidoListItem
): string[] => (isPedidoUsuarioRow(pedido) ? [pedido.pedidoUsuarioId] : []);
