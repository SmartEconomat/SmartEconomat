/** Clase pública (StockPorUbicacionDto). Paquete: smart-economat-backend (Nest). */
export class StockPorUbicacionDto {
  productoId: string;
  productoNombre: string;
  ubicacionId: string;
  ubicacionNombre: string;
  stock: number;
}

/** Clase pública (StockConsolidadoDto). Paquete: smart-economat-backend (Nest). */
export class StockConsolidadoDto {
  productoId: string;
  productoNombre: string;
  stockTotal: number;
}
