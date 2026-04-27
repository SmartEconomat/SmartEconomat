/**
 * Documentación en español.
 */
export enum TipoMovimiento {
  /**
   * Documentación en español.
   */
  ENTRADA = 'entrada',
  /**
   * Documentación en español.
   */
  SALIDA = 'salida',
  /**
   * Documentación en español.
   */
  AJUSTE = 'ajuste',
  /**
   * Documentación en español.
   */
  PEDIDO = 'pedido',
  /**
   * Documentación en español.
   */
  ENTRADA_COMPRA = 'entrada_compra',
  /**
   * Documentación en español.
   */
  SALIDA_DISTRIBUCION = 'salida_distribucion',
  /**
   * Documentación en español.
   */
  ENTRADA_DISTRIBUCION = 'entrada_distribucion',
  /**
   * Documentación en español.
   */
  SALIDA_ELABORACION = 'salida_elaboracion',
  /**
   * Documentación en español.
   */
  PRODUCCION_CONSUMO = 'produccion_consumo',
  /**
   * Documentación en español.
   */
  PRODUCCION_RESULTADO = 'produccion_resultado',
  /**
   * Documentación en español.
   */
  SALIDA_AJUSTE = 'salida_ajuste',
  /**
   * Documentación en español.
   */
  MERMA = 'merma',
}

/**
 * Documentación en español.
 */
export enum TipoMovimientoManual {
  /**
   * Documentación en español.
   */
  ENTRADA = TipoMovimiento.ENTRADA,
  /**
   * Documentación en español.
   */
  AJUSTE = TipoMovimiento.AJUSTE,
  /**
   * Documentación en español.
   */
  SALIDA_AJUSTE = TipoMovimiento.SALIDA_AJUSTE,
}

export const TIPOS_DISPONIBLES: string[] = Object.values(TipoMovimiento);
export const TIPOS_MOVIMIENTO_MANUAL: string[] =
  Object.values(TipoMovimientoManual);
