export class ProductoPrecioActualizadoEvent {
  constructor(
    public readonly productoId: string,
    public readonly proveedorId: string,
    public readonly nuevoPrecio: number,
    public readonly previoPrecio?: number
  ) {}
}
