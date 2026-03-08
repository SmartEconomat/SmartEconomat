import { IProductoProveedor } from './producto-proveedor.interface';
import { IProductoAlergeno } from './producto-alergeno.interface';

export interface IProducto {
  id: string;
  nombre: string;
  descripcion?: string;
  alergenos: IProductoAlergeno[];
  proveedores: IProductoProveedor[];
}
