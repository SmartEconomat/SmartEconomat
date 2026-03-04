import { Producto } from '../producto.entity/producto.entity';
import { AlergenoProducto } from '../enums/producto.enums';
import { ParseUUIDPipe } from '@nestjs/common';

export interface IProductoAlergeno {
  id: ParseUUIDPipe;
  alergeno: AlergenoProducto;
  producto: Producto;
}
