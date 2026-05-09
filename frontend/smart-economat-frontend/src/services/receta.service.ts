import {
  Receta,
  RecetaCostResponse,
  RecetaPayload,
  RecetaPreviewCostPayload,
} from './receta.types';
import {
  baseFetch,
  buildQueryParams,
  PaginatedData,
  parseApiResponse,
} from './api.service';
import {
  normalizeLimitParam,
  normalizePageParam,
  toOptionalTrimmedString,
} from './api.utils';
import { DownloadOptions, DownloadService } from './download.service';

const RECETAS_DEFAULT_LIMIT = 20;
const RECETAS_MAX_LIMIT = 50;

type RecetaSortOrder = 'asc' | 'desc' | 'ASC' | 'DESC';

type FetchRecetasOptions = {
  minTiempoMinutos?: number;
  maxTiempoMinutos?: number;
};

function normalizeRecetaSortOrder(
  value?: RecetaSortOrder
): 'ASC' | 'DESC' | undefined {
  if (!value) {
    return undefined;
  }

  return String(value).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
}

/**
 * Expone "fetchRecetas" en smart-economat-frontend (SPA).
 * @undefined {number} page - Entrada efectiva esperada por el contrato.
 * @undefined {number} limit - Entrada efectiva esperada por el contrato.
 * @undefined {string} search - Entrada efectiva esperada por el contrato.
 * @undefined {string | undefined} sortBy - Entrada efectiva esperada por el contrato.
 * @undefined {RecetaSortOrder | undefined} sortOrder - Entrada efectiva esperada por el contrato.
 * @undefined {FetchRecetasOptions | undefined} options - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PaginatedData<Receta>>} Datos efectivos después de ejecutar la operación.
 */
export async function fetchRecetas(
  page: number = 1,
  limit: number = RECETAS_DEFAULT_LIMIT,
  search: string = '',
  sortBy?: string,
  sortOrder?: RecetaSortOrder,
  options?: FetchRecetasOptions
): Promise<PaginatedData<Receta>> {
  const normalizedPage = normalizePageParam(page);
  const normalizedLimit = normalizeLimitParam(
    limit,
    RECETAS_DEFAULT_LIMIT,
    RECETAS_MAX_LIMIT
  );
  const normalizedSearch = toOptionalTrimmedString(search);
  const normalizedSortBy = toOptionalTrimmedString(sortBy);
  const normalizedOrder = normalizeRecetaSortOrder(sortOrder);

  const query = buildQueryParams(
    {
      page: normalizedPage,
      limit: normalizedLimit,
      search: normalizedSearch,
      sortBy: normalizedSortBy,
      order: normalizedOrder,
      minTiempoMinutos:
        options?.minTiempoMinutos !== undefined &&
        Number.isFinite(options.minTiempoMinutos)
          ? options.minTiempoMinutos
          : undefined,
      maxTiempoMinutos:
        options?.maxTiempoMinutos !== undefined &&
        Number.isFinite(options.maxTiempoMinutos)
          ? options.maxTiempoMinutos
          : undefined,
    },
    RECETAS_DEFAULT_LIMIT,
    RECETAS_MAX_LIMIT
  );

  const response = await baseFetch(`/recetas?${query.toString()}`);
  const body = await parseApiResponse<PaginatedData<Receta>>(
    response,
    'Error al obtener recetas'
  );
  return body.data;
}

/**
 * Crea recursos nuevos en base a las reglas de negocio.
 * @undefined {Omit<Partial<Receta>, "ingredientes"> & { ingredientes?: import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/receta.types").RecetaIngredientePayload[]; } & { imagen?: File; }} receta - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Receta>} Datos efectivos después de ejecutar la operación.
 */
export async function createReceta(
  receta: RecetaPayload & { imagen?: File }
): Promise<Receta> {
  const payload = Object.fromEntries(
    Object.entries(receta).filter(([key]) => key !== 'imagen')
  );

  const response = await baseFetch('/recetas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const body = await parseApiResponse<Receta>(
    response,
    'Error al crear receta'
  );
  return body.data;
}

/**
 * Persiste modificaciones válidas sobre entidades existentes.
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Omit<Partial<Receta>, "ingredientes"> & { ingredientes?: import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/receta.types").RecetaIngredientePayload[]; } & { imagen?: File; }} receta - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Receta>} Datos efectivos después de ejecutar la operación.
 */
export async function updateReceta(
  id: string,
  receta: RecetaPayload & { imagen?: File }
): Promise<Receta> {
  const payload = Object.fromEntries(
    Object.entries(receta).filter(([key]) => key !== 'imagen')
  );

  const response = await baseFetch(`/recetas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  const body = await parseApiResponse<Receta>(
    response,
    'Error al actualizar receta'
  );
  return body.data;
}

/** Alias público (RecetaDetalleApiData) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type RecetaDetalleApiData = {
  receta: Receta;
  detalleIngredientes: Array<{
    productoId: string;
    productoNombre: string;
    cantidadNecesaria: number;
    stockActual: number;
    cantidadFaltante: number;
    unidad: string;
  }>;
  alergenosConsolidados: string[];
};

/**
 * Obtiene valores o vistas materializadas.
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<RecetaDetalleApiData>} Datos efectivos después de ejecutar la operación.
 */
export async function getRecetaDetalle(
  id: string
): Promise<RecetaDetalleApiData> {
  const response = await baseFetch(`/recetas/${id}/detalle`);
  const body = await parseApiResponse<RecetaDetalleApiData>(
    response,
    'Error al obtener detalle de la receta'
  );
  return body.data;
}

/**
 * Expone "calculateRecetaPreviewCost" en smart-economat-frontend (SPA).
 * @undefined {RecetaPreviewCostPayload} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<RecetaCostResponse>} Datos efectivos después de ejecutar la operación.
 */
export async function calculateRecetaPreviewCost(
  payload: RecetaPreviewCostPayload
): Promise<RecetaCostResponse> {
  const response = await baseFetch('/recetas/calculate-preview', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const body = await parseApiResponse<RecetaCostResponse>(
    response,
    'Error al calcular el coste estimado de la receta'
  );

  return body.data;
}

/**
 * Expone "exportRecipesPdf" en smart-economat-frontend (SPA).
 * @undefined {string[]} ids - Entrada efectiva esperada por el contrato.
 * @undefined {{ includeImage?: boolean; toast: DownloadOptions["toast"]; }} options - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function exportRecipesPdf(
  ids: string[],
  options: { includeImage?: boolean; toast: DownloadOptions['toast'] }
): Promise<void> {
  if (ids.length === 0) {
    throw new Error('Debe seleccionar al menos una receta para exportar.');
  }

  const query = new URLSearchParams({
    ids: ids.join(','),
    includeImage: String(options.includeImage !== false),
  });

  await DownloadService.downloadFile(
    `/recetas/export/pdf?${query.toString()}`,
    {
      filename: `SmartEconomat_Recetas_${new Date().toISOString().split('T')}.pdf`,
      toast: options.toast,
    }
  );
}
