export enum TipoResolucion {
  ACEPTADA = 'aceptada',
  RECHAZADA = 'rechazada',
  PARCIAL = 'parcial',
  DEVOLUCION = 'devolucion',
  ABONO = 'abono',
  CAMBIO = 'cambio',
}

export enum TipoIncidencia {
  ROTURA = 'rotura',
  CADUCADO = 'caducado',
  FALTA_PRODUCTO = 'falta_producto',
  EXCESO_PRODUCTO = 'exceso_producto',
  OTRO = 'otro',
}

export const TIPOS_RESOLUCION_DISPONIBLES: string[] =
  Object.values(TipoResolucion);
