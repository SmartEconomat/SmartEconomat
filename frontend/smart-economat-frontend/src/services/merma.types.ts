import { Producto } from './producto.types';
import { Usuario } from '../types/usuario';

/** Catálogo de valores enumerados (MotivoMerma) dentro de smart-economat-frontend (SPA). */
export enum MotivoMerma {
  ROTURA = 'rotura',
  DETERIORO = 'deterioro',
  HURTO = 'hurto',
  ERROR_PREPARACION = 'error_preparacion',
  OTROS = 'otros',
}

/** Catálogo de valores enumerados (TipoMerma) dentro de smart-economat-frontend (SPA). */
export enum TipoMerma {
  RECEPCION = 'recepcion',
  PRODUCCION = 'produccion',
  CADUCIDAD = 'caducidad',
  ROTURA = 'rotura',
  INVENTARIO = 'inventario',
  HURTO = 'hurto',
}

/** Contrato de tipos público (Merma). Contexto: smart-economat-frontend (SPA). */
export interface Merma {
  id: string;
  productoId: string;
  producto?: Producto;
  usuarioId?: string;
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

/** Contrato de tipos público (CreateMermaPayload). Contexto: smart-economat-frontend (SPA). */
export interface CreateMermaPayload {
  productoId: string;
  cantidad: number;
  motivo: MotivoMerma;
  tipo?: TipoMerma;
  origenEntidad?: string;
  origenId?: string;
  referenciaId?: string;
  inventarioId?: string;
  ubicacionId?: string;
  idempotencyKey?: string;
  notas?: string;
}

/** Contrato de tipos público (CreateMermaProduccionPayload). Contexto: smart-economat-frontend (SPA). */
export interface CreateMermaProduccionPayload {
  produccionLoteId: string;
  productoId: string;
  cantidad: number;
  motivo?: MotivoMerma;
  inventarioId?: string;
  ubicacionId?: string;
  notas?: string;
  idempotencyKey?: string;
}

/** Contrato de tipos público (MermaStats). Contexto: smart-economat-frontend (SPA). */
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

/** Parámetros opcionales para estadísticas de merma (misma ventana que usa el backend por defecto). */
export interface MermaStatsQueryParams {
  startDate?: string;
  endDate?: string;
  motivo?: MotivoMerma;
}

/** Contrato de tipos público (MermasQueryParams). Contexto: smart-economat-frontend (SPA). */
export interface MermasQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
  motivo?: MotivoMerma;
  startDate?: string;
  endDate?: string;
}
