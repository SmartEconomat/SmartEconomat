import { IProductoProveedor } from '../interfaces/producto-proveedor.interface';
import { IProductoAlergeno } from './producto-alergeno.interface';

export interface IProducto {
  id: number;
  nombre: string;
  descripcion?: string;
  alergenos: IProductoAlergeno[];
  proveedores: IProductoProveedor[];
}
