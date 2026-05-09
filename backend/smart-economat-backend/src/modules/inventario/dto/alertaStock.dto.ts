/** Clase pública (AlertaStockDTO). Paquete: smart-economat-backend (Nest). */
export class AlertaStockDTO {
  id: string;
  cantidadActual: number;
  cantidadMinima: number;
  nombreProducto: string;
  unidad?: string;
  proveedorNombre?: string;
  ubicacionNombre?: string;
}
