export enum TipoMovimiento {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
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
}

export enum TipoMovimientoManual {
  ENTRADA = TipoMovimiento.ENTRADA,
  AJUSTE = TipoMovimiento.AJUSTE,
  SALIDA_AJUSTE = TipoMovimiento.SALIDA_AJUSTE,
}

export const TIPOS_DISPONIBLES: string[] = Object.values(TipoMovimiento);
export const TIPOS_MOVIMIENTO_MANUAL: string[] =
  Object.values(TipoMovimientoManual);
