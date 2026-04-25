import { EstadoPedido, Pedido, PurchaseBatch } from './pedido.types';

/**
 * @description Returns the subset of pedidos within a batch that are pending reception (estado POR_RECEPCIONAR).
 * @param {PurchaseBatch} batch - The purchase batch to filter.
 * @returns {Pedido[]} List of receivable pedidos.
 */
export const getReceivableBatchPedidos = (batch: PurchaseBatch): Pedido[] =>
  (batch.pedidos || []).filter(
    (pedido) => pedido.estado === EstadoPedido.POR_RECEPCIONAR
  );

/**
 * @description Returns `true` if the batch contains at least one pedido pending reception.
 * @param {PurchaseBatch} batch - The purchase batch to check.
 * @returns {boolean} Whether the batch has receivable pedidos.
 */
export const hasReceivableBatchPedidos = (batch: PurchaseBatch): boolean =>
  getReceivableBatchPedidos(batch).length > 0;
