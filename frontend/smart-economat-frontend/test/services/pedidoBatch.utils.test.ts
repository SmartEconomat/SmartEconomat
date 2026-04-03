import { describe, expect, it } from 'vitest';
import {
  EstadoLote,
  EstadoPedido,
  Pedido,
  PurchaseBatch,
} from '../../src/services/pedido.types';
import {
  getReceivableBatchPedidos,
  hasReceivableBatchPedidos,
} from '../../src/services/pedidoBatch.utils';

const TEST_DATE = '2025-01-01T10:00:00.000Z';

const createPedido = (id: string, estado: EstadoPedido): Pedido => ({
  id,
  estado,
  costeTotal: 0,
  fechaPedido: TEST_DATE,
});

const createBatch = (estado: EstadoLote, pedidos: Pedido[]): PurchaseBatch => ({
  id: 'batch-1',
  createdAt: TEST_DATE,
  estado,
  pedidos,
});

describe('pedidoBatch.utils', () => {
  it('devuelve solo pedidos por recepcionar', () => {
    const batch = createBatch(EstadoLote.PARCIAL, [
      createPedido('pedido-1', EstadoPedido.POR_RECEPCIONAR),
      createPedido('pedido-2', EstadoPedido.RECEPCIONADO),
      createPedido('pedido-3', EstadoPedido.CANCELADO),
    ]);

    expect(getReceivableBatchPedidos(batch)).toEqual([
      expect.objectContaining({ id: 'pedido-1' }),
    ]);
  });

  it('detecta solo pedidos realmente recepcionables', () => {
    const batch = createBatch(EstadoLote.PARCIAL, [
      createPedido('pedido-1', EstadoPedido.POR_RECEPCIONAR),
      createPedido('pedido-2', EstadoPedido.RECEPCIONADO),
      createPedido('pedido-3', EstadoPedido.CANCELADO),
    ]);

    expect(getReceivableBatchPedidos(batch)).toEqual([
      expect.objectContaining({ id: 'pedido-1' }),
    ]);
    expect(hasReceivableBatchPedidos(batch)).toBe(true);
  });

  it('detecta cuando no quedan pedidos recepcionables', () => {
    const batch = createBatch(EstadoLote.COMPLETADO, [
      createPedido('pedido-1', EstadoPedido.RECEPCIONADO),
    ]);

    expect(getReceivableBatchPedidos(batch)).toEqual([]);
    expect(hasReceivableBatchPedidos(batch)).toBe(false);
  });
});
