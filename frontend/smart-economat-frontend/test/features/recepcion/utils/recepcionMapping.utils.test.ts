import { describe, it, expect } from 'vitest';
import {
  mapPedidoToDraftLines,
  mapPurchaseBatchToRecepcionDraft,
} from '../../../../src/features/recepcion/utils/recepcionMapping.utils';
import {
  Pedido,
  EstadoPedido,
  EstadoLote,
} from '../../../../src/services/pedido.types';

describe('recepcionMapping.utils', () => {
  const mockPedido: Pedido = {
    id: 'ped-123',
    estado: EstadoPedido.EN_PROCESO,
    costeTotal: 100,
    fechaPedido: new Date().toISOString(),
    proveedor: {
      id: 'prov-1',
      nombre: 'Proveedor Test',
    },
    pedidoProductos: [
      {
        id: 'pp-1',
        id_producto_proveedor: 'ppr-1',
        cantidad: 10,
        precioUnitario: 5,
        productoProveedor: {
          id: 'ppr-1',
          precioUnitario: 5,
          producto: {
            id: 'prod-1',
            nombre: 'Producto Escala',
            codigoBarras: '11111111',
          },
          proveedor: {
            id: 'prov-1',
            nombre: 'Proveedor Test',
          },
        },
      },
    ],
  };

  it('debería inicializar las líneas del pedido con isWeighedWithScale en false', () => {
    const lines = mapPedidoToDraftLines(mockPedido);

    expect(lines).toHaveLength(1);
    expect(lines[0].isWeighedWithScale).toBe(false);
    expect(lines[0].cantidadRecibida).toBe(0);
    expect(lines[0].estado).toBe('No entregado');
  });

  it('debería mapear un PurchaseBatch entero inicializando los flags de báscula', () => {
    const draft = mapPurchaseBatchToRecepcionDraft({
      id: 'batch-1',
      estado: EstadoLote.PENDIENTE,
      createdAt: new Date().toISOString(),
      observaciones: 'Test',
      pedidos: [mockPedido],
    });

    expect(draft.pedidosSeleccionados).toHaveLength(1);
    expect(draft.pedidosSeleccionados[0].lineas[0].isWeighedWithScale).toBe(
      false
    );
  });
});
