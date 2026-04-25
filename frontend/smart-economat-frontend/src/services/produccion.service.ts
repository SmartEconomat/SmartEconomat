import { baseFetch, PaginatedData, parseApiResponse } from './api.service';
import {
  normalizeLimitParam,
  normalizePageParam,
  toOptionalTrimmedString,
} from './api.utils';
import { Receta } from './receta.types';

const PRODUCCION_DEFAULT_LIMIT = 20;
const PRODUCCION_MAX_LIMIT = 50;

export interface ProduccionLote {
  id: string;
  recetaId: string;
  usuarioId: string;
  createdAt?: string;
  updatedAt?: string;
  cantidadProducida: number;
  fechaProduccion: string;
  fechaAgotado?: string | null;
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

/**
 * @description Fetches a paginated list of production batch records.
 * @param {number} [page=1] - Page number to retrieve.
 * @param {number} [limit=20] - Number of records per page.
 * @param {string} [estado] - Optional status filter (e.g. 'disponible', 'agotado').
 * @returns {Promise<PaginatedData<ProduccionLote>>} Paginated production batch records.
 * @throws {ApiError} When the API returns an error response.
 */
export async function fetchProducciones(
  page: number = 1,
  limit: number = PRODUCCION_DEFAULT_LIMIT,
  estado?: string
): Promise<PaginatedData<ProduccionLote>> {
  const normalizedPage = normalizePageParam(page);
  const normalizedLimit = normalizeLimitParam(
    limit,
    PRODUCCION_DEFAULT_LIMIT,
    PRODUCCION_MAX_LIMIT
  );
  const normalizedEstado = toOptionalTrimmedString(estado);

  const query = new URLSearchParams({
    page: String(normalizedPage),
    limit: String(normalizedLimit),
  });
  if (normalizedEstado) query.append('estado', normalizedEstado);

  const response = await baseFetch(`/produccion?${query.toString()}`);
  const body = await parseApiResponse<PaginatedData<ProduccionLote>>(
    response,
    'Error al obtener producciones'
  );
  return body.data;
}

/**
 * @description Executes a production run for a recipe, consuming ingredients and generating a production batch.
 * @param {EjecutarProduccionDto} dto - Production parameters including recipe ID, quantity, and optional expiry date.
 * @returns {Promise<ProduccionLote>} The resulting production batch record.
 * @throws {ApiError} When the API returns an error response.
 */
export async function ejecutarProduccion(
  dto: EjecutarProduccionDto
): Promise<ProduccionLote> {
  const response = await baseFetch('/produccion/ejecutar', {
    method: 'POST',
    body: JSON.stringify(dto),
  });

  const body = await parseApiResponse<ProduccionLote>(
    response,
    'Error al ejecutar produccion'
  );
  return body.data;
}

/**
 * @description Records consumption of portions or quantity from a specific production batch.
 * @param {string} id - The production batch UUID to consume from.
 * @param {ConsumirProduccionDto} dto - Consumption type ('raciones' | 'cantidad') and amount.
 * @returns {Promise<ProduccionLote>} The updated production batch record.
 * @throws {ApiError} When the API returns an error response.
 */
export async function consumirPorciones(
  id: string,
  dto: ConsumirProduccionDto
): Promise<ProduccionLote> {
  const response = await baseFetch(`/produccion/lote/${id}/consumir`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });

  const body = await parseApiResponse<ProduccionLote>(
    response,
    'Error al consumir porciones'
  );
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

/**
 * @description Validates whether sufficient stock exists to produce the requested recipe quantities.
 * @param {ValidarStockDto} dto - List of recipe IDs and quantities to validate.
 * @returns {Promise<StockValidationResult>} Per-ingredient availability with cheapest supplier info.
 * @throws {ApiError} When the API returns an error response.
 */
export async function validarStock(
  dto: ValidarStockDto
): Promise<StockValidationResult> {
  const response = await baseFetch('/produccion/validar', {
    method: 'POST',
    body: JSON.stringify(dto),
  });

  const body = await parseApiResponse<StockValidationResult>(
    response,
    'Error al validar stock'
  );
  return body.data;
}
