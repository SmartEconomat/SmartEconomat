/** Catálogo de valores enumerados (EstadoLote) dentro de smart-economat-backend (Nest). */
export enum EstadoLote {
  PENDIENTE = 'pendiente',
  PARCIAL = 'parcial',
  COMPLETADO = 'completado',
  INCIDENCIA = 'incidencia',
  CANCELADO = 'cancelado',
}

/** Constantes públicas (ESTADO_LOTE_DB_VALUES) expuestas en smart-economat-backend (Nest). */
export const ESTADO_LOTE_DB_VALUES = [
  EstadoLote.PENDIENTE,
  EstadoLote.PARCIAL,
  EstadoLote.COMPLETADO,
  EstadoLote.INCIDENCIA,
  EstadoLote.CANCELADO,
] as const;
