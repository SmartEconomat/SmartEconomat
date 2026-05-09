/** Clase pública (ProductoPrecioActualizadoEvent). Paquete: smart-economat-backend (Nest). */
export class ProductoPrecioActualizadoEvent {
  /**
   * Construye la instancia configurada.
   * @undefined {string} productoId - Entrada efectiva esperada por el contrato.
   * @undefined {string} proveedorId - Entrada efectiva esperada por el contrato.
   * @undefined {number} nuevoPrecio - Entrada efectiva esperada por el contrato.
   * @undefined {number | undefined} previoPrecio - Entrada efectiva esperada por el contrato.
   */
  constructor(
    public readonly productoId: string,
    public readonly proveedorId: string,
    public readonly nuevoPrecio: number,
    public readonly previoPrecio?: number
  ) {}
}
