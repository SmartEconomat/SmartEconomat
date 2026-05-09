import { EstadoProductoRecepcion } from '../enums/estado-producto.enum';
import { EstadoVisualProducto } from '../enums/estado-visual.enum';

/** Contrato de tipos público (EstadoProductoInput). Contexto: smart-economat-backend (Nest). */
export interface EstadoProductoInput {
  estadoProducto?: EstadoProductoRecepcion | null;
  estadoVisual?: EstadoVisualProducto | null;
}

/**
 * Expone "resolveEstadoProducto" en smart-economat-backend (Nest).
 * @undefined {EstadoProductoInput} input - Entrada efectiva esperada por el contrato.
 * @undefined {EstadoProductoRecepcion} Datos efectivos después de ejecutar la operación.
 */
export function resolveEstadoProducto(
  input: EstadoProductoInput
): EstadoProductoRecepcion {
  if (input.estadoProducto) {
    return input.estadoProducto;
  }

  if (
    input.estadoVisual === EstadoVisualProducto.ROTO ||
    input.estadoVisual === EstadoVisualProducto.DEFECTUOSO
  ) {
    return EstadoProductoRecepcion.ROTO;
  }

  return EstadoProductoRecepcion.PERFECTO;
}

/**
 * Expone "permiteIncrementarInventario" en smart-economat-backend (Nest).
 * @undefined {EstadoProductoRecepcion} estadoProducto - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export function permiteIncrementarInventario(
  estadoProducto: EstadoProductoRecepcion
): boolean {
  return ![
    EstadoProductoRecepcion.ROTO,
    EstadoProductoRecepcion.FALTA_TOTAL,
  ].includes(estadoProducto);
}

/**
 * Expone "permiteComputarComoRecibido" en smart-economat-backend (Nest).
 * @undefined {EstadoProductoRecepcion} estadoProducto - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export function permiteComputarComoRecibido(
  estadoProducto: EstadoProductoRecepcion
): boolean {
  return [
    EstadoProductoRecepcion.PERFECTO,
    EstadoProductoRecepcion.EXCEDE,
  ].includes(estadoProducto);
}

/**
 * Expone "esEstadoConIncidencia" en smart-economat-backend (Nest).
 * @undefined {EstadoProductoRecepcion} estadoProducto - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export function esEstadoConIncidencia(
  estadoProducto: EstadoProductoRecepcion
): boolean {
  return estadoProducto !== EstadoProductoRecepcion.PERFECTO;
}
