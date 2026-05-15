import { BadRequestException } from '@nestjs/common';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import type { Pedido } from '../pedido.entity/pedido.entity';

const transitions: Record<EstadoPedido, EstadoPedido[]> = {
  [EstadoPedido.PENDIENTE_DE_APROBACION]: [
    EstadoPedido.POR_RECEPCIONAR,
    EstadoPedido.CANCELADO,
    EstadoPedido.PARCIAL,
    EstadoPedido.RECEPCIONADO,
    EstadoPedido.INCIDENCIA,
  ],
  [EstadoPedido.POR_RECEPCIONAR]: [
    EstadoPedido.PARCIAL,
    EstadoPedido.RECEPCIONADO,
    EstadoPedido.INCIDENCIA,
    EstadoPedido.CANCELADO,
  ],
  [EstadoPedido.PARCIAL]: [
    EstadoPedido.RECEPCIONADO,
    EstadoPedido.INCIDENCIA,
    EstadoPedido.PARCIAL,
  ],
  [EstadoPedido.INCIDENCIA]: [
    EstadoPedido.RECEPCIONADO,
    EstadoPedido.PARCIAL,
    EstadoPedido.INCIDENCIA,
  ],
  [EstadoPedido.RECEPCIONADO]: [],
  [EstadoPedido.CANCELADO]: [EstadoPedido.PENDIENTE_DE_APROBACION],
};

/** Máquina de estados para pedidos a proveedor (Pedido). */
export class PedidoStateMachine {
  /**
   * Valida transición de estado; no-op si origen y destino coinciden.
   */
  static validateTransition(
    currentState: EstadoPedido,
    targetState: EstadoPedido
  ): void {
    if (currentState === targetState) {
      return;
    }
    const allowed = transitions[currentState];
    if (!allowed?.includes(targetState)) {
      throw new BadRequestException(
        `Transición de estado de pedido inválida: no se puede pasar de ${currentState} a ${targetState}.`
      );
    }
  }

  /**
   * Aplica transición validada sobre la entidad.
   */
  static applyTransition(pedido: Pedido, targetState: EstadoPedido): void {
    this.validateTransition(pedido.estado, targetState);
    pedido.estado = targetState;
  }
}
