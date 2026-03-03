export enum TipoResolucion {
  ACEPTADA = 'aceptada',
  RECHAZADA = 'rechazada',
  PARCIAL = 'parcial',
  DEVOLUCION = 'devolucion',
}

export const TIPOS_RESOLUCION_DISPONIBLES: string[] =
  Object.values(TipoResolucion);
