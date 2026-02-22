/**
 * Estados posibles de una Recepcion.
 *
 * COMPLETADA     — Todos los ítems recibidos correctamente (cant_recibida == cant_pedida).
 * PARCIAL        — Al menos un ítem recibido con cantidad inferior a la pedida.
 *                  El pedido vinculado permanece EN_PROCESO hasta recepción posterior.
 * CON_INCIDENCIAS — Al menos un ítem con diferencia (exceso, falta o cantidad=0).
 *                   Se generan registros en la tabla `incidencia` automáticamente.
 */
export enum EstadoRecepcion {
  COMPLETADA = 'COMPLETADA',
  PARCIAL = 'PARCIAL',
  CON_INCIDENCIAS = 'CON_INCIDENCIAS',
}
