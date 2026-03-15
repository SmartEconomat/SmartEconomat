import { EstadoProductoRecepcion } from '../enums/estado-producto.enum';
import { EstadoVisualProducto } from '../enums/estado-visual.enum';

export interface EstadoProductoInput {
  estadoProducto?: EstadoProductoRecepcion | null;
  estadoVisual?: EstadoVisualProducto | null;
}

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

export function permiteIncrementarInventario(
  estadoProducto: EstadoProductoRecepcion
): boolean {
  return ![
    EstadoProductoRecepcion.ROTO,
    EstadoProductoRecepcion.FALTA_TOTAL,
  ].includes(estadoProducto);
}

export function permiteComputarComoRecibido(
  estadoProducto: EstadoProductoRecepcion
): boolean {
  return [
    EstadoProductoRecepcion.PERFECTO,
    EstadoProductoRecepcion.EXCEDE,
  ].includes(estadoProducto);
}

export function esEstadoConIncidencia(
  estadoProducto: EstadoProductoRecepcion
): boolean {
  return estadoProducto !== EstadoProductoRecepcion.PERFECTO;
}
