import { baseFetch, PaginatedData, parseApiResponse } from './api.service';
import { Receta } from './receta.types';

/** Contrato de tipos público (ProduccionLote). Contexto: smart-economat-frontend (SPA). */
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
  estado: 'disponible' | 'agotado' | 'cancelado';
}

/** Contrato de tipos público (ValidarStockDto). Contexto: smart-economat-frontend (SPA). */
export interface ValidarStockDto {
  items: { recetaId: string; cantidadAProducir: number }[];
}

export interface ProduccionItemEscalado {
  recetaId: string;
  cantidadAProducir: number;
  rendimientoBase: number;
  racionesReceta: number;
  cantidadFisicaObjetivo: number;
  factorEscalado: number;
}

/** Contrato de tipos público (StockValidationResult). Contexto: smart-economat-frontend (SPA). */
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
  itemsResumen?: ProduccionItemEscalado[];
}

/** Contrato de tipos público (EjecutarProduccionDto). Contexto: smart-economat-frontend (SPA). */
export interface EjecutarProduccionDto {
  recetaId: string;
  /** Mutuamente excluyente con `cantidadAProducir` */
  cantidadProducida?: number;
  /** Porciones a producir (0,5); mutuamente excluyente con `cantidadProducida`. */
  cantidadAProducir?: number;
  fechaCaducidadManual?: string;
  ubicacionDestinoId?: string;
  idempotencyKey: string;
}

/** Alias público (TipoConsumoProduccion) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type TipoConsumoProduccion = 'raciones' | 'cantidad';

/** Contrato de tipos público (ConsumirProduccionDto). Contexto: smart-economat-frontend (SPA). */
export interface ConsumirProduccionDto {
  tipo: TipoConsumoProduccion;
  valor: number;
  idempotencyKey: string;
}

/**
 * Recupera el histórico de lotes de producción, paginado y filtrable por estado.
 */
/**
 * Expone "fetchProducciones" en smart-economat-frontend (SPA).
 * @undefined {number} page - Entrada efectiva esperada por el contrato.
 * @undefined {number} limit - Entrada efectiva esperada por el contrato.
 * @undefined {string | undefined} estado - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PaginatedData<ProduccionLote>>} Datos efectivos después de ejecutar la operación.
 */
export async function fetchProducciones(
  page?: number,
  limit?: number,
  estado?: string
): Promise<PaginatedData<ProduccionLote>>;
export async function fetchProducciones(params?: {
  page?: number;
  limit?: number;
  estado?: string;
  sortBy?: string;
  order?: string;
  searchTerm?: string;
}): Promise<PaginatedData<ProduccionLote>>;
export async function fetchProducciones(
  arg1:
    | number
    | {
        page?: number;
        limit?: number;
        estado?: string;
        sortBy?: string;
        order?: string;
        searchTerm?: string;
      }
    | undefined = {},
  arg2?: number,
  arg3?: string
): Promise<PaginatedData<ProduccionLote>> {
  const params =
    typeof arg1 === 'number'
      ? { page: arg1, limit: arg2, estado: arg3 }
      : (arg1 ?? {});
  const query = new URLSearchParams();

  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.estado) query.append('status', params.estado);
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.order) query.append('order', params.order.toUpperCase());
  if (params.searchTerm) {
    query.append('searchTerm', params.searchTerm);
    query.append('search', params.searchTerm);
  }

  const response = await baseFetch(`/produccion?${query.toString()}`);
  const body = await parseApiResponse<PaginatedData<ProduccionLote>>(
    response,
    'Error al obtener producciones'
  );
  return body.data;
}

/**
 * Ejecuta un lote de producción, descontando ingredientes del inventario y creando el lote.
 */
/**
 * Expone "ejecutarProduccion" en smart-economat-frontend (SPA).
 * @undefined {EjecutarProduccionDto} dto - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<ProduccionLote>} Datos efectivos después de ejecutar la operación.
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
 * Registra el consumo de porciones de un lote de producción existente.
 */
/**
 * Expone "consumirPorciones" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {ConsumirProduccionDto} dto - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<ProduccionLote>} Datos efectivos después de ejecutar la operación.
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

/**
 * Valida si hay stock suficiente para producir los ítems indicados.
 */
/**
 * Expone "validarStock" en smart-economat-frontend (SPA).
 * @undefined {ValidarStockDto} dto - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<StockValidationResult>} Datos efectivos después de ejecutar la operación.
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
