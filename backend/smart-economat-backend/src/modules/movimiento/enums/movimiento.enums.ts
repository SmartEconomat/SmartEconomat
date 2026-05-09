/**
 * Tipos de movimientos de stock (dirección y origen).
 */
export enum TipoMovimiento {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
  TRANSFERENCIA = 'transferencia',
  AJUSTE = 'ajuste',
  PEDIDO = 'pedido',
  ENTRADA_COMPRA = 'entrada_compra',
  SALIDA_DISTRIBUCION = 'salida_distribucion',
  ENTRADA_DISTRIBUCION = 'entrada_distribucion',
  SALIDA_ELABORACION = 'salida_elaboracion',
  PRODUCCION_CONSUMO = 'produccion_consumo',
  PRODUCCION_RESULTADO = 'produccion_resultado',
  SALIDA_AJUSTE = 'salida_ajuste',
  MERMA = 'merma',
  AUDITORIA = 'auditoria',
}

/**
 * Tipos de movimientos que pueden realizarse manualmente.
 */
export enum TipoMovimientoManual {
  ENTRADA = TipoMovimiento.ENTRADA,
  AJUSTE = TipoMovimiento.AJUSTE,
  SALIDA_AJUSTE = TipoMovimiento.SALIDA_AJUSTE,
}

/**
 * Acciones de auditoría para el historial de movimientos.
 */
export enum AccionMovimiento {
  CREATE = 'CREAR',
  UPDATE = 'ACTUALIZAR',
  DELETE = 'ELIMINAR',
  CONFIG_CHANGE = 'CONFIG_CHANGE',
  RESOLVEINCIDENCIA = 'RESOLVEINCIDENCIA',
  AUDIT = 'AUDIT',
  OTRO = 'OTRO',
}

/** Constantes públicas (TIPOS_DISPONIBLES) expuestas en smart-economat-backend (Nest). */
export const TIPOS_DISPONIBLES: string[] = Object.values(TipoMovimiento);
/** Constantes públicas (TIPOS_MOVIMIENTO_MANUAL) expuestas en smart-economat-backend (Nest). */
export const TIPOS_MOVIMIENTO_MANUAL: string[] =
  Object.values(TipoMovimientoManual);
/** Constantes públicas (ACCIONES_DISPONIBLES) expuestas en smart-economat-backend (Nest). */
export const ACCIONES_DISPONIBLES: string[] = Object.values(AccionMovimiento);
