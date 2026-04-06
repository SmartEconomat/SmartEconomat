import { describe, expect, it } from 'vitest';
import {
  formatBatchNumber,
  formatBatchReference,
  formatPedidoListNumber,
  getBatchPedidosCount,
} from '../../../../src/features/pedidos/utils/pedidoFormatters';
import {
  EstadoLote,
  EstadoPedido,
  PurchaseBatch,
} from '../../../../src/services/pedido.types';

describe('pedidoFormatters', () => {
  it('prioriza el numero de pedido proveedor en contexto proveedor', () => {
    expect(
      formatPedidoListNumber(
        {
          id: 'ped-1',
          numeroGlobal: '150',
          numeroPedidoProveedor: '200150',
          numeroPedidoVisible: '42',
        },
        'pedido-proveedor'
      )
    ).toBe('200150');
  });

  it('usa el numero de pedido visible en contexto visible', () => {
    expect(
      formatPedidoListNumber(
        {
          id: 'ped-2',
          numeroGlobal: '150',
          numeroPedidoProveedor: '200150',
          numeroPedidoVisible: '42',
        },
        'pedido-visible'
      )
    ).toBe('42');
  });

  it('en auto para pedido usuario mantiene numero visible', () => {
    expect(
      formatPedidoListNumber({
        id: 'pu-1',
        entityType: 'pedido_usuario',
        numeroGlobal: '44',
        numeroPedidoVisible: '44',
      })
    ).toBe('44');
  });

  it('devuelve el conteo real de pedidos proveedor del lote', () => {
    const batch = {
      id: 'batch-1',
      estado: EstadoLote.PENDIENTE,
      createdAt: '2026-04-04T10:00:00.000Z',
      pedidos: [
        {
          id: 'ped-1',
          estado: EstadoPedido.POR_RECEPCIONAR,
          fechaPedido: '2026-04-04T10:00:00.000Z',
          costeTotal: 10,
        },
        {
          id: 'ped-2',
          estado: EstadoPedido.POR_RECEPCIONAR,
          fechaPedido: '2026-04-04T10:00:00.000Z',
          costeTotal: 20,
        },
      ],
    } as PurchaseBatch;

    expect(getBatchPedidosCount(batch)).toBe(2);
  });

  it('resuelve identidad de lote desde numero y referencia explicita', () => {
    const batch = {
      id: 'batch-2',
      estado: EstadoLote.PENDIENTE,
      createdAt: '2026-04-04T10:00:00.000Z',
      numeroLote: '100001',
      referenciaLote: 'LC-100001',
      pedidos: [],
    } as PurchaseBatch;

    expect(formatBatchNumber(batch)).toBe('100001');
    expect(formatBatchReference(batch)).toBe('LC-100001');
  });
});
