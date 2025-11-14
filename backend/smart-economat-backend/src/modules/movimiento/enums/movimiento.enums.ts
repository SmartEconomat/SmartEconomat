export enum TipoMovimiento {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
  AJUSTE = 'ajuste',
  PEDIDO = 'pedido',
}

export const TIPOS_DISPONIBLES: string[] = Object.values(TipoMovimiento);
