import { EstadoPedidoUsuario } from '../../../src/modules/pedido/enums/estado-pedido-usuario.enum';
import {
  canApprove,
  canConsolidate,
  canConsolidateWeek,
} from '../../../src/modules/pedido/domain/order-consolidation.rules';

describe('order-consolidation.rules', () => {
  it('permite aprobar un pedido pendiente sin recepciones', () => {
    expect(
      canApprove({
        estado: EstadoPedidoUsuario.PENDIENTE,
        pedidos: [{ recepcionesPedido: [] }],
      })
    ).toBe(true);
  });

  it('impide consolidar un pedido pendiente sin auto-aprobación', () => {
    expect(
      canConsolidate({
        estado: EstadoPedidoUsuario.PENDIENTE,
        pedidos: [{ recepcionesPedido: [] }],
      })
    ).toEqual({
      allowed: false,
      reason: 'order.pendingRequiresAutoApproval',
    });
  });

  it('permite consolidar un pedido pendiente con auto-aprobación', () => {
    expect(
      canConsolidate(
        {
          estado: EstadoPedidoUsuario.PENDIENTE,
          pedidos: [{ batchId: null, recepcionesPedido: [] }],
        },
        { autoApprovePending: true }
      )
    ).toEqual({
      allowed: true,
      requiresAutoApproval: true,
    });
  });

  it('impide consolidar un pedido con recepciones', () => {
    expect(
      canConsolidate({
        estado: EstadoPedidoUsuario.APROBADO,
        pedidos: [{ recepcionesPedido: [{}] }],
      })
    ).toEqual({
      allowed: false,
      reason: 'order.hasRecepciones',
    });
  });

  it('permite consolidar semana cuando todos son válidos', () => {
    expect(
      canConsolidateWeek(
        {
          orders: [
            {
              estado: EstadoPedidoUsuario.APROBADO,
              pedidos: [{ recepcionesPedido: [] }],
            },
            {
              estado: EstadoPedidoUsuario.PENDIENTE,
              pedidos: [{ batchId: null, recepcionesPedido: [] }],
            },
          ],
        },
        { autoApprovePending: true }
      )
    ).toEqual({ allowed: true });
  });
});
