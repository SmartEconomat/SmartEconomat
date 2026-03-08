import { Producto } from '../producto.entity/producto.entity';
import { Alergeno } from '../enums/producto.enums';

export interface IProductoAlergeno {
  id: string;
  alergeno: Alergeno;
  producto: Producto;
}
