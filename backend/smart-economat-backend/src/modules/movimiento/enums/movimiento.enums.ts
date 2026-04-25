/**
 * All possible movement types that can be recorded in the inventory audit log.
 *
 * @enum {string}
 */
export enum TipoMovimiento {
  /** Generic manual stock entry (increases inventory). */
  ENTRADA = 'entrada',
  /** Generic manual stock exit (decreases inventory). */
  SALIDA = 'salida',
  /** Stock quantity adjustment without a clear entry/exit direction. */
  AJUSTE = 'ajuste',
  /** Stock reservation linked to a purchase order. */
  PEDIDO = 'pedido',
  /** Stock entry from a supplier reception (goods received). */
  ENTRADA_COMPRA = 'entrada_compra',
  /** Stock exit due to internal distribution to another location. */
  SALIDA_DISTRIBUCION = 'salida_distribucion',
  /** Stock entry from an incoming internal distribution. */
  ENTRADA_DISTRIBUCION = 'entrada_distribucion',
  /** Stock exit caused by a recipe elaboration (ingredient consumption). */
  SALIDA_ELABORACION = 'salida_elaboracion',
  /** Stock exit for ingredients consumed during a production batch. */
  PRODUCCION_CONSUMO = 'produccion_consumo',
  /** Stock entry for the finished product resulting from a production batch. */
  PRODUCCION_RESULTADO = 'produccion_resultado',
  /** Manual downward stock adjustment (loss, discard, correction). */
  SALIDA_AJUSTE = 'salida_ajuste',
  /** Stock exit due to waste (merma) registration. */
  MERMA = 'merma',
}

/**
 * Subset of TipoMovimiento values that operators are allowed to create manually via the API.
 *
 * @enum {string}
 */
export enum TipoMovimientoManual {
  /** Manual stock entry. */
  ENTRADA = TipoMovimiento.ENTRADA,
  /** Generic stock adjustment. */
  AJUSTE = TipoMovimiento.AJUSTE,
  /** Manual downward stock adjustment. */
  SALIDA_AJUSTE = TipoMovimiento.SALIDA_AJUSTE,
}

export const TIPOS_DISPONIBLES: string[] = Object.values(TipoMovimiento);
export const TIPOS_MOVIMIENTO_MANUAL: string[] =
  Object.values(TipoMovimientoManual);
