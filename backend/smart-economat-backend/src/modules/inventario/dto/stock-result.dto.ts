export class StockPorUbicacionDto {
  productoId: string;
  productoNombre: string;
  ubicacionId: string;
  ubicacionNombre: string;
  stock: number;
}

export class StockConsolidadoDto {
  productoId: string;
  productoNombre: string;
  stockTotal: number;
}
