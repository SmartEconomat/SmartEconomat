import { Producto } from '../producto.entity/producto.entity';
import { AlergenoProducto } from '../enums/product.enums';

export interface IProductoAlergeno {
  id: number;
  alergeno: AlergenoProducto;
  producto: Producto;
}
