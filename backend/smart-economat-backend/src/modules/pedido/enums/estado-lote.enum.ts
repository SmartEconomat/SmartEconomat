export enum EstadoLote {
  /**
   * Todos los pedidos del lote están en estado inicial (PENDIENTE).
   */
  PENDIENTE = 'pendiente',

  /**
   * Algunos pedidos han avanzado (EN_PROCESO, RECIBIDO) pero otros no han finalizado.
   */
  PARCIAL = 'parcial',

  /**
   * Todos los pedidos del lote han alcanzado un estado final (RECIBIDO, CANCELADO, INCIDENCIA).
   */
  COMPLETADO = 'completado',
}
