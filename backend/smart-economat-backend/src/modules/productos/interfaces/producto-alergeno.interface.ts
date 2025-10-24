import { Producto } from '../producto.entity/producto.entity';
import { AlergenoProducto } from '../enums/producto.enums';

export interface IProductoAlergeno {
  id: number;
  alergeno: AlergenoProducto;
  producto: Producto;
}
