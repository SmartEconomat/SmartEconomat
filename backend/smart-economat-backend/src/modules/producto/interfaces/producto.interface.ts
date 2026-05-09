import { IProductoProveedor } from './producto-proveedor.interface';
import { IProductoAlergeno } from './producto-alergeno.interface';

/** Contrato de tipos público (IProducto). Contexto: smart-economat-backend (Nest). */
export interface IProducto {
  id: string;
  nombre: string;
  descripcion?: string;
  alergenos: IProductoAlergeno[];
  proveedores: IProductoProveedor[];
}
