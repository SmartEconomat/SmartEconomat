import type { EntityManager } from 'typeorm';
import { In } from 'typeorm';
import { Pedido } from '../../modules/pedido/pedido.entity/pedido.entity';
import { EstadoPedido } from '../../modules/pedido/enums/estado-pedido.enum';
import { RecepcionPedido } from '../../modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity';

/** Constantes públicas (INVALID_RECEPTION_ORDER_STATES) expuestas en smart-economat-backend (Nest). */
export const INVALID_RECEPTION_ORDER_STATES = [
  EstadoPedido.PENDIENTE_DE_APROBACION,
  EstadoPedido.PARCIAL,
  EstadoPedido.RECEPCIONADO,
  EstadoPedido.INCIDENCIA,
  EstadoPedido.CANCELADO,
] as const;

/** Alias público (InvalidReceptionState) para simplificar payloads o props en smart-economat-backend (Nest). */
export type InvalidReceptionState =
  (typeof INVALID_RECEPTION_ORDER_STATES)[number];

/** Alias público (InvalidReceptionLink) para simplificar payloads o props en smart-economat-backend (Nest). */
export type InvalidReceptionLink = {
  pedidoId: string;
  recepcionId: string;
  recepcionPedidoId: string;
  estado: EstadoPedido;
};

/**
 * Expone "findInvalidReceptionLinks" en smart-economat-backend (Nest).
 * @undefined {EntityManager} manager - Entrada efectiva esperada por el contrato.
 * @undefined {readonly EstadoPedido[]} invalidStates - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<InvalidReceptionLink[]>} Datos efectivos después de ejecutar la operación.
 */
export async function findInvalidReceptionLinks(
  manager: EntityManager,
  invalidStates: readonly EstadoPedido[] = INVALID_RECEPTION_ORDER_STATES
): Promise<InvalidReceptionLink[]> {
  if (invalidStates.length === 0) {
    return [];
  }

  const pedidos = await manager.find(Pedido, {
    where: { estado: In([...invalidStates]) },
    select: ['id', 'estado'],
  });

  if (pedidos.length === 0) {
    return [];
  }

  const pedidoEstadoMap = new Map(
    pedidos.map((pedido) => [pedido.id, pedido.estado])
  );

  const recepcionesPedido = await manager.find(RecepcionPedido, {
    where: { pedidoId: In(pedidos.map((pedido) => pedido.id)) },
    select: ['id', 'pedidoId', 'recepcionId'],
  });

  return recepcionesPedido.map((item) => ({
    pedidoId: item.pedidoId,
    recepcionId: item.recepcionId,
    recepcionPedidoId: item.id,
    estado:
      pedidoEstadoMap.get(item.pedidoId) ??
      EstadoPedido.PENDIENTE_DE_APROBACION,
  }));
}
