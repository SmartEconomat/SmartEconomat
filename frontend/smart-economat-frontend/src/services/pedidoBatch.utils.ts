import { EstadoPedido, Pedido, PurchaseBatch } from './pedido.types';

/**
 * Documentación en español.
 */
export const getReceivableBatchPedidos = (batch: PurchaseBatch): Pedido[] =>
  (batch.pedidos || []).filter(
    (pedido) => pedido.estado === EstadoPedido.POR_RECEPCIONAR
  );

/**
 * Documentación en español.
 */
export const hasReceivableBatchPedidos = (batch: PurchaseBatch): boolean =>
  getReceivableBatchPedidos(batch).length > 0;
