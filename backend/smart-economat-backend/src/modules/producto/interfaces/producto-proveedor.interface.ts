import { Proveedor } from '../../proveedor/proveedor.entity/proveedor.entity';
import { Producto } from '../producto.entity/producto.entity';

export interface IProductoProveedor {
  id: string;
  producto: Producto;
  proveedor: Proveedor;
  precioUnitario?: number;
}
