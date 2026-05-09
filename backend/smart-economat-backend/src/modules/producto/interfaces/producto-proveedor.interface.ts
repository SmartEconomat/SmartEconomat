import { Proveedor } from '../../proveedor/proveedor.entity/proveedor.entity';
import { Producto } from '../producto.entity/producto.entity';

/** Contrato de tipos público (IProductoProveedor). Contexto: smart-economat-backend (Nest). */
export interface IProductoProveedor {
  id: string;
  producto: Producto;
  proveedor: Proveedor;
  precioUnitario?: number;
}
