import { Producto } from '../producto.entity/producto.entity';
import { Alergeno } from '../enums/producto.enums';

/** Contrato de tipos público (IProductoAlergeno). Contexto: smart-economat-backend (Nest). */
export interface IProductoAlergeno {
  id: string;
  alergeno: Alergeno;
  producto: Producto;
}
