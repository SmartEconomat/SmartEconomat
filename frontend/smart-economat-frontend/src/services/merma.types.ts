import { Producto } from './producto.types';
import { Usuario } from '../types/usuario';

export enum MotivoMerma {
  ROTURA = 'rotura',
  DETERIORO = 'deterioro',
  HURTO = 'hurto',
  ERROR_PREPARACION = 'error_preparacion',
  OTROS = 'otros',
}

export enum TipoMerma {
  RECEPCION = 'recepcion',
  PRODUCCION = 'produccion',
  CADUCIDAD = 'caducidad',
  ROTURA = 'rotura',
  INVENTARIO = 'inventario',
}

export interface Merma {
  id: string;
  productoId: string;
  producto?: Producto;
  usuarioId: string | number;
  usuario?: Usuario;
  cantidad: number;
  motivo: MotivoMerma;
  tipo?: TipoMerma;
  origenEntidad?: string;
  origenId?: string;
  referenciaId?: string;
  idempotencyKey?: string;
  notas?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMermaPayload {
  productoId: string;
  cantidad: number;
  motivo: MotivoMerma;
  tipo?: TipoMerma;
  origenEntidad?: string;
  origenId?: string;
  referenciaId?: string;
  idempotencyKey?: string;
  notas?: string;
}

export interface CreateMermaProduccionPayload {
  produccionLoteId: string;
  productoId: string;
  cantidad: number;
  motivo?: MotivoMerma;
  notas?: string;
  idempotencyKey?: string;
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
