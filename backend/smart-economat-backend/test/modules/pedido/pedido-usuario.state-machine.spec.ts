import { BadRequestException } from '@nestjs/common';
import { PedidoUsuarioStateMachine } from '../../../src/modules/pedido/state/pedido-usuario.state-machine';
import { EstadoPedidoUsuario } from '../../../src/modules/pedido/enums/estado-pedido-usuario.enum';
import { PedidoUsuario } from '../../../src/modules/pedido/pedido-usuario.entity/pedido-usuario.entity';

describe('PedidoUsuarioStateMachine', () => {
  it('permite transicion valida BORRADOR -> PENDIENTE', () => {
    expect(() =>
      PedidoUsuarioStateMachine.validateTransition(
        EstadoPedidoUsuario.BORRADOR,
        EstadoPedidoUsuario.PENDIENTE
      )
    ).not.toThrow();
  });

  it('rechaza transicion invalida APROBADO -> PENDIENTE', () => {
    expect(() =>
      PedidoUsuarioStateMachine.validateTransition(
        EstadoPedidoUsuario.APROBADO,
        EstadoPedidoUsuario.PENDIENTE
      )
    ).toThrow(BadRequestException);
  });

  it('aplica transicion sobre entidad de pedido usuario', () => {
    const pedido = {
      estado: EstadoPedidoUsuario.PENDIENTE,
    } as { estado: EstadoPedidoUsuario };

    PedidoUsuarioStateMachine.applyTransition(
      pedido as unknown as PedidoUsuario,
      EstadoPedidoUsuario.APROBADO
    );

    expect(pedido.estado).toBe(EstadoPedidoUsuario.APROBADO);
  });
});
