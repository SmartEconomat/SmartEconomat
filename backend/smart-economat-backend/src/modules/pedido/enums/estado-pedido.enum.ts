/** Catálogo de valores enumerados (EstadoPedido) dentro de smart-economat-backend (Nest). */
export enum EstadoPedido {
  PENDIENTE_DE_APROBACION = 'pendiente_de_aprobacion',

  POR_RECEPCIONAR = 'por_recepcionar',

  RECEPCIONADO = 'recepcionado',

  INCIDENCIA = 'incidencia',

  PARCIAL = 'parcial',

  CANCELADO = 'cancelado',
}

/** Constantes públicas (ESTADO_PEDIDO_DB_VALUES) expuestas en smart-economat-backend (Nest). */
export const ESTADO_PEDIDO_DB_VALUES = [
  EstadoPedido.PENDIENTE_DE_APROBACION,
  EstadoPedido.POR_RECEPCIONAR,
  EstadoPedido.RECEPCIONADO,
  EstadoPedido.INCIDENCIA,
  EstadoPedido.PARCIAL,
  EstadoPedido.CANCELADO,
] as const;
