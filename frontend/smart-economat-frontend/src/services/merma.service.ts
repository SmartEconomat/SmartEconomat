import {
  baseFetch,
  ApiResponse,
  buildQueryParams,
  PaginatedData,
} from './api.service';
import {
  Merma,
  CreateMermaPayload,
  CreateMermaProduccionPayload,
  MermaStats,
  MermasQueryParams,
  MermaStatsQueryParams,
} from './merma.types';

/**
 * Construye la cadena de query string a partir de los filtros de mermas.
 */
function buildMermasQueryString(params?: MermasQueryParams): string {
  const search = buildQueryParams(
    {
      page: params?.page,
      limit: params?.limit,
      sortBy: params?.sortBy,
      order: params?.order,
      motivo: params?.motivo,
      startDate: params?.startDate,
      endDate: params?.endDate,
    },
    20,
    50
  );

  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

function buildMermaStatsQueryString(params?: MermaStatsQueryParams): string {
  const search = new URLSearchParams();
  if (params?.startDate) {
    search.set('startDate', params.startDate);
  }
  if (params?.endDate) {
    search.set('endDate', params.endDate);
  }
  if (params?.motivo) {
    search.set('motivo', params.motivo);
  }

  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

function isPaginatedMermaPayload(
  value: unknown
): value is PaginatedData<Merma> {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const v = value as Record<string, unknown>;
  return Array.isArray(v.data) && typeof v.total === 'number';
}

/**
 * Recupera una lista paginada de registros de merma.
 */
export async function fetchMermas(
  params?: MermasQueryParams
): Promise<PaginatedData<Merma>> {
  const query = buildMermasQueryString(params);
  const response = await baseFetch(`/merma${query}`);
  if (!response.ok) {
    throw new Error(`Error al obtener mermas: ${response.status}`);
  }
  const body = (await response.json()) as ApiResponse<PaginatedData<Merma>>;

  if (isPaginatedMermaPayload(body.data)) {
    return body.data;
  }

  throw new Error('Respuesta de mermas con formato inesperado');
}

/**
 * Registra una nueva pérdida o merma de stock manual.
 */
export async function createMerma(payload: CreateMermaPayload): Promise<Merma> {
  const response = await baseFetch('/merma', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Error al registrar merma: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<Merma>;
  return body.data;
}

/**
 * Registra una merma derivada de un proceso de producción en cocina.
 */
export async function createMermaProduccion(
  payload: CreateMermaProduccionPayload
): Promise<Merma> {
  const response = await baseFetch('/merma/produccion/reportar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message ||
        `Error al registrar merma desde produccion: ${response.status}`
    );
  }

  const body = (await response.json()) as ApiResponse<Merma>;
  return body.data;
}

/**
 * Obtiene las estadísticas agregadas de mermas (totales, por motivo, etc.).
 */
export async function fetchMermaStats(
  params?: MermaStatsQueryParams
): Promise<MermaStats> {
  const query = buildMermaStatsQueryString(params);
  const response = await baseFetch(`/merma/stats${query}`);
  if (!response.ok) {
    throw new Error(
      `Error al obtener estadísticas de merma: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<MermaStats>;
  return body.data;
}
