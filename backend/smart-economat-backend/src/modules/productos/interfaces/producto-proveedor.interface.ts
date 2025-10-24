import { Producto } from '../producto.entity/producto.entity';
import { Proveedor } from '../proveedor.entity/proveedor.entity';

export interface IProductoProveedor {
  id: number;
  producto: Producto;
  proveedor: Proveedor;
}
