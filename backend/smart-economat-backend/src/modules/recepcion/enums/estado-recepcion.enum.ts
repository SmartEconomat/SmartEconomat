/**
 * Estados posibles de una Recepcion.
 *
 * COMPLETADA     — Todos los ítems recibidos correctamente (cant_recibida == cant_pedida).
 * CON_INCIDENCIAS — Al menos un ítem con diferencia (exceso, falta o cantidad=0).
 *                   Se generan registros en la tabla `incidencia` automáticamente.
 */
export enum EstadoRecepcion {
  COMPLETADA = 'COMPLETADA',
  CON_INCIDENCIAS = 'CON_INCIDENCIAS',
}
