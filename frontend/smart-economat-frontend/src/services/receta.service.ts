import { Receta, RecetaPayload } from './receta.types';
import { baseFetch, PaginatedData, parseApiResponse } from './api.service';
import {
  normalizeLimitParam,
  normalizePageParam,
  toOptionalTrimmedString,
} from './api.utils';
import { DownloadOptions, DownloadService } from './download.service';

const RECETAS_DEFAULT_LIMIT = 20;
const RECETAS_MAX_LIMIT = 50;

type RecetaSortOrder = 'asc' | 'desc' | 'ASC' | 'DESC';

function normalizeRecetaSortOrder(
  value?: RecetaSortOrder
): 'ASC' | 'DESC' | undefined {
  if (!value) {
    return undefined;
  }

  return String(value).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
}

const BACKEND_MAX_PAGE_LIMIT = 50;

export async function fetchRecetas(
  page: number = 1,
  limit: number = RECETAS_DEFAULT_LIMIT,
  search: string = '',
  sortBy?: string,
  sortOrder?: RecetaSortOrder
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

  const query = new URLSearchParams({
    page: String(normalizedPage),
    limit: String(normalizedLimit),
  });

  if (normalizedSearch) {
    query.append('searchTerm', normalizedSearch);
  }

  if (normalizedSortBy) {
    query.append('sortBy', normalizedSortBy);
  }

  if (normalizedOrder) {
    query.append('order', normalizedOrder);
  }

  const response = await baseFetch(`/recetas?${query.toString()}`);
  const body = await parseApiResponse<PaginatedData<Receta>>(
    response,
    'Error al obtener recetas'
  );
  return body.data;
}

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

type RecetaDetalleApiData = {
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
export async function calculatePreviewCost(dto: {
  ingredientes: Array<{
    productoId: string;
    cantidad: number;
    unidad: string;
    mermaAplicada?: number;
    proveedorFavoritoId?: string;
  }>;
  rendimiento?: number;
}): Promise<{ costoTotal: number; costoUnitarioEstimado?: number }> {
  const response = await baseFetch('/recetas/calculate-preview', {
    method: 'POST',
    body: JSON.stringify(dto),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Error al previsualizar coste: ${response.status}`);
  }
  const body = (await response.json()) as ApiResponse<{
    costoTotal: number;
    costoUnitarioEstimado?: number;
  }>;
  return body.data;
}
