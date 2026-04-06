import { describe, expect, it } from 'vitest';
import {
  EstadoPedido,
  EstadoPedidoUsuario,
  Pedido,
  PedidoUsuarioRow,
} from '../../../../src/services/pedido.types';
import {
  getPedidoUsuarioSelectionIds,
  isPedidoUsuarioRow,
} from '../../../../src/features/pedidos/utils/pedidoOwnOrders';

const TEST_DATE = '2025-01-01T10:00:00.000Z';

const createPedido = (
  id: string,
  estado: EstadoPedido,
  overrides: Partial<Pedido> = {}
): Pedido => ({
  id,
  estado,
  costeTotal: 10,
  fechaPedido: TEST_DATE,
  ...overrides,
});

const createPedidoUsuarioRow = (
  overrides: Partial<PedidoUsuarioRow> = {}
): PedidoUsuarioRow => ({
  id: 'pedido-usuario-1',
  pedidoUsuarioId: 'pedido-usuario-1',
  entityType: 'pedido_usuario',
  numeroGlobal: '42',
  estado: EstadoPedidoUsuario.PENDIENTE,
  costeTotal: 10,
  fechaPedido: TEST_DATE,
  proveedor: {
    id: 'proveedor-visible',
    nombre: 'Proveedor visible',
  },
  pedidoProductos: [],
  ...overrides,
});

describe('pedidoOwnOrders', () => {
  it('reconoce explícitamente una fila visible de pedido_usuario', () => {
    const pedidoVisible = createPedidoUsuarioRow();

    expect(isPedidoUsuarioRow(pedidoVisible)).toBe(true);
    expect(getPedidoUsuarioSelectionIds(pedidoVisible)).toEqual([
      'pedido-usuario-1',
    ]);
  });

  it('no hace seleccionable un pedido interno por proveedor', () => {
    const pedidoInterno = createPedido(
      'pedido-1',
      EstadoPedido.POR_RECEPCIONAR
    );

    expect(isPedidoUsuarioRow(pedidoInterno)).toBe(false);
    expect(getPedidoUsuarioSelectionIds(pedidoInterno)).toEqual([]);
  });
});
