import { IProductoProveedor } from './producto-proveedor.interface';
import { IProductoAlergeno } from './producto-alergeno.interface';
import { ParseUUIDPipe } from '@nestjs/common';

export interface IProducto {
  id: ParseUUIDPipe;
  nombre: string;
  descripcion?: string;
  alergenos: IProductoAlergeno[];
  proveedores: IProductoProveedor[];
}
