export enum TipoMovimiento {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
  AJUSTE = 'ajuste',
  PEDIDO = 'pedido',
  ENTRADA_COMPRA = 'entrada_compra',
}

export const TIPOS_DISPONIBLES: string[] = Object.values(TipoMovimiento);
