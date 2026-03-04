import { ParseUUIDPipe } from '@nestjs/common/pipes/parse-uuid.pipe';
import { Proveedor } from '../../proveedor/proveedor.entity/proveedor.entity';
import { Producto } from '../producto.entity/producto.entity';

export interface IProductoProveedor {
  id: ParseUUIDPipe;
  producto: Producto;
  proveedor: Proveedor;
  precioUnitario?: number;
}
