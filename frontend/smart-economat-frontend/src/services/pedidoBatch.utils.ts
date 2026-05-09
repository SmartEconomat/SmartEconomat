import { EstadoPedido, Pedido, PurchaseBatch } from './pedido.types';

/**
 * Filtra los pedidos de un lote que aún están pendientes de recepcionar.
 */
/**
 * Obtiene valores o vistas materializadas.
 * @undefined {PurchaseBatch} batch - Entrada efectiva esperada por el contrato.
 * @undefined {Pedido[]} Datos efectivos después de ejecutar la operación.
 */
export const getReceivableBatchPedidos = (batch: PurchaseBatch): Pedido[] =>
  (batch.pedidos || []).filter(
    (pedido) => pedido.estado === EstadoPedido.POR_RECEPCIONAR
  );

/**
 * Indica si un lote contiene al menos un pedido pendiente de recepcionar.
 */
/**
 * Expone "hasReceivableBatchPedidos" en smart-economat-frontend (SPA).
 * @undefined {PurchaseBatch} batch - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export const hasReceivableBatchPedidos = (batch: PurchaseBatch): boolean =>
  getReceivableBatchPedidos(batch).length > 0;
