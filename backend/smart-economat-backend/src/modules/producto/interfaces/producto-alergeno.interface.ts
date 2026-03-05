import { Producto } from '../producto.entity/producto.entity';
import { Alergeno } from '../enums/producto.enums';
import { ParseUUIDPipe } from '@nestjs/common';

export interface IProductoAlergeno {
  id: ParseUUIDPipe;
  alergeno: Alergeno;
  producto: Producto;
}
