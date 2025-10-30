import { ProductoProveedor } from '../../productos/producto-proveedor.entity/producto-proveedor.entity';
export interface HistorialPrecio {
  id: string;
  id_producto_proveedor: ProductoProveedor;
  precio: number;
  fecha: Date;
}
