/** Catálogo de valores enumerados (TipoResolucion) dentro de smart-economat-backend (Nest). */
export enum TipoResolucion {
  ACEPTADA = 'aceptada',
  RECHAZADA = 'rechazada',
  PARCIAL = 'parcial',
  DEVOLUCION = 'devolucion',
  ABONO = 'abono',
  CAMBIO = 'cambio',
}

/** Catálogo de valores enumerados (EstadoIncidencia) dentro de smart-economat-backend (Nest). */
export enum EstadoIncidencia {
  ABIERTA = 'ABIERTA',
  EN_PROCESO = 'EN_PROCESO',
  RESUELTA = 'RESUELTA',
}

/** Catálogo de valores enumerados (EstadoLineaIncidencia) dentro de smart-economat-backend (Nest). */
export enum EstadoLineaIncidencia {
  SIN_PROBLEMA = 'SIN_PROBLEMA',
  PENDIENTE_AJUSTE = 'PENDIENTE_AJUSTE',
  AJUSTADO = 'AJUSTADO',
}

/** Catálogo de valores enumerados (TipoIncidencia) dentro de smart-economat-backend (Nest). */
export enum TipoIncidencia {
  ROTURA = 'rotura',
  CADUCADO = 'caducado',
  FALTA_PRODUCTO = 'falta_producto',
  EXCESO_PRODUCTO = 'exceso_producto',
  OTRO = 'otro',
}

/** Catálogo de valores enumerados (TipoDiferencia) dentro de smart-economat-backend (Nest). */
export enum TipoDiferencia {
  FALTANTE = 'FALTANTE',
  EXCESO = 'EXCESO',
  DEFECTUOSO = 'DEFECTUOSO',
}

/** Catálogo de valores enumerados (EstadoReclamacion) dentro de smart-economat-backend (Nest). */
export enum EstadoReclamacion {
  PENDIENTE = 'PENDIENTE',
  RECLAMADO = 'RECLAMADO',
  ABONADO = 'ABONADO',
  REENVIADO = 'REENVIADO',
}

/** Constantes públicas (TIPOS_RESOLUCION_DISPONIBLES) expuestas en smart-economat-backend (Nest). */
export const TIPOS_RESOLUCION_DISPONIBLES: string[] =
  Object.values(TipoResolucion);
