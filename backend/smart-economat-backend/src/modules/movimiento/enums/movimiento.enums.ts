export enum TipoMovimiento {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
  AJUSTE = 'ajuste',
  PEDIDO = 'pedido',
  ENTRADA_COMPRA = 'entrada_compra',
  SALIDA_ELABORACION = 'salida_elaboracion',
  PRODUCCION_CONSUMO = 'produccion_consumo',
  PRODUCCION_RESULTADO = 'produccion_resultado',
  SALIDA_AJUSTE = 'salida_ajuste',
}

export const TIPOS_DISPONIBLES: string[] = Object.values(TipoMovimiento);
