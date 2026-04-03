export enum EstadoLote {
  PENDIENTE = 'pendiente',
  PARCIAL = 'parcial',
  COMPLETADO = 'completado',
  INCIDENCIA = 'incidencia',
  CANCELADO = 'cancelado',
}

export const ESTADO_LOTE_DB_VALUES = [
  EstadoLote.PENDIENTE,
  EstadoLote.PARCIAL,
  EstadoLote.COMPLETADO,
  EstadoLote.INCIDENCIA,
  EstadoLote.CANCELADO,
] as const;
