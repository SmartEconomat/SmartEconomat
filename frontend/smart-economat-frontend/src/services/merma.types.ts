import { Producto } from './producto.types';
import { Usuario } from '../types/usuario';

export enum MotivoMerma {
  ROTURA = 'rotura',
  DETERIORO = 'deterioro',
  HURTO = 'hurto',
  ERROR_PREPARACION = 'error_preparacion',
  OTROS = 'otros',
}

export interface Merma {
  id: string;
  productoId: string;
  producto?: Producto;
  usuarioId: string | number;
  usuario?: Usuario;
  cantidad: number;
  motivo: MotivoMerma;
  notas?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMermaPayload {
  productoId: string;
  cantidad: number;
  motivo: MotivoMerma;
  notas?: string;
}

export interface MermaStats {
  porMotivo: Array<{
    motivo: MotivoMerma;
    totalRegistros: number;
    totalCantidad: number;
  }>;
  porProducto: Array<{
    productoId: string;
    productoNombre: string;
    totalRegistros: number;
    totalCantidad: number;
  }>;
}

export interface MermasQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
  motivo?: MotivoMerma;
  startDate?: string;
  endDate?: string;
}
