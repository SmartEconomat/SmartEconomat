import { BadRequestException } from '@nestjs/common';
import { EstadoPedidoUsuario } from '../enums/estado-pedido-usuario.enum';
import { PedidoUsuario } from '../pedido-usuario.entity/pedido-usuario.entity';

/** Clase pública (PedidoUsuarioStateMachine). Paquete: smart-economat-backend (Nest). */
export class PedidoUsuarioStateMachine {
  static readonly transitions: Record<
    EstadoPedidoUsuario,
    EstadoPedidoUsuario[]
  > = {
    [EstadoPedidoUsuario.BORRADOR]: [
      EstadoPedidoUsuario.PENDIENTE,
      EstadoPedidoUsuario.CANCELADO,
    ],
    [EstadoPedidoUsuario.PENDIENTE]: [
      EstadoPedidoUsuario.APROBADO,
      EstadoPedidoUsuario.CONSOLIDADO,
      EstadoPedidoUsuario.CANCELADO,
    ],
    [EstadoPedidoUsuario.APROBADO]: [
      EstadoPedidoUsuario.CONSOLIDADO,
      EstadoPedidoUsuario.CANCELADO,
    ],
    [EstadoPedidoUsuario.CONSOLIDADO]: [EstadoPedidoUsuario.CANCELADO],
    [EstadoPedidoUsuario.CANCELADO]: [EstadoPedidoUsuario.PENDIENTE],
  };

  /**
   * Expone "validateTransition" en smart-economat-backend (Nest).
   * @undefined {EstadoPedidoUsuario} currentState - Entrada efectiva esperada por el contrato.
   * @undefined {EstadoPedidoUsuario} targetState - Entrada efectiva esperada por el contrato.
   * @undefined {void} Datos efectivos después de ejecutar la operación.
   */
  static validateTransition(
    currentState: EstadoPedidoUsuario,
    targetState: EstadoPedidoUsuario
  ): void {
    if (currentState === targetState) return;

    const validTransitions = this.transitions[currentState];
    if (!validTransitions || !validTransitions.includes(targetState)) {
      throw new BadRequestException(
        `Transición de estado inválida: no se puede pasar de ${currentState} a ${targetState}.`
      );
    }
  }

  /**
   * Expone "applyTransition" en smart-economat-backend (Nest).
   * @undefined {PedidoUsuario} pedido - Entrada efectiva esperada por el contrato.
   * @undefined {EstadoPedidoUsuario} targetState - Entrada efectiva esperada por el contrato.
   * @undefined {void} Datos efectivos después de ejecutar la operación.
   */
  static applyTransition(
    pedido: PedidoUsuario,
    targetState: EstadoPedidoUsuario
  ): void {
    this.validateTransition(pedido.estado, targetState);
    pedido.estado = targetState;
  }
}
