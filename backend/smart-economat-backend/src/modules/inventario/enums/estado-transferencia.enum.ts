/**
 * Ciclo de vida de una orden de transferencia de stock entre ubicaciones.
 */
export enum EstadoTransferencia {
  BORRADOR = 'borrador',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada',
}
