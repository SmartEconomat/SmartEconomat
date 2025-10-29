import { Proveedor } from 'src/modules/proveedor/proveedor.entity/proveedor.entity';
import { Producto } from '../producto.entity/producto.entity';

export interface IProductoProveedor {
  id: number;
  producto: Producto;
  proveedor: Proveedor;
  precio: number;
}
