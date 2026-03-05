export enum TipoMovimiento {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
  AJUSTE = 'ajuste',
  PEDIDO = 'pedido',
  ENTRADA_COMPRA = 'entrada_compra',
  SALIDA_ELABORACION = 'salida_elaboracion',
}

export const TIPOS_DISPONIBLES: string[] = Object.values(TipoMovimiento);
