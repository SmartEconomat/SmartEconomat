import { baseFetch, PaginatedData } from './api.service';
import { Receta } from './receta.types';

export interface ProduccionLote {
  id: string;
  recetaId: string;
  usuarioId: string;
  cantidadProducida: number;
  fechaProduccion: string;
  fechaCaducidad?: string;
  costeTotalReal: number;
  receta?: Receta;
  usuario?: {
    id: string;
    nombre: string;
  };
  porcionesProducidas: number;
  porcionesRestantes: number;
  estado: 'disponible' | 'agotado';
}

export interface EjecutarProduccionDto {
  recetaId: string;
  cantidadProducida: number;
  fechaCaducidadManual?: string;
  ubicacionDestinoId?: string;
}

export type TipoConsumoProduccion = 'raciones' | 'cantidad';

export interface ConsumirProduccionDto {
  tipo: TipoConsumoProduccion;
  valor: number;
}

export async function fetchProducciones(
  page: number = 1,
  limit: number = 20,
  estado?: string
): Promise<PaginatedData<ProduccionLote>> {
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (estado) query.append('estado', estado);

  const response = await baseFetch(`/produccion?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Error al obtener producciones: ${response.status}`);
  }
  const body = await response.json();
  return body.data;
}

export async function ejecutarProduccion(
  dto: EjecutarProduccionDto
): Promise<ProduccionLote> {
  const response = await baseFetch('/produccion/ejecutar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Error al ejecutar producción');
  }

  const body = await response.json();
  return body.data;
}

export async function consumirPorciones(
  id: string,
  dto: ConsumirProduccionDto
): Promise<ProduccionLote> {
  const response = await baseFetch(`/produccion/lote/${id}/consumir`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Error al consumir porciones');
  }

  const body = await response.json();
  return body.data;
}
export interface ValidarStockDto {
  items: { recetaId: string; cantidad: number }[];
}

export interface StockValidationResult {
  ingredients: {
    productoId: string;
    nombre: string;
    requerido: number;
    disponible: number;
    unidad: string;
    isEnough: boolean;
    cheapestProveedorId?: string;
    cheapestProveedorNombre?: string;
    cheapestProductoProveedorId?: string;
    cheapestPrecio?: number;
  }[];
}

export async function validarStock(
  dto: ValidarStockDto
): Promise<StockValidationResult> {
  const response = await baseFetch('/produccion/validar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error('Error al validar stock');
  }

  const body = await response.json();
  return body.data;
}
