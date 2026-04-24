import { baseFetch, ApiResponse, PaginatedData } from './api.service';
import {
  Merma,
  CreateMermaPayload,
  CreateMermaProduccionPayload,
  MermaStats,
  MermasQueryParams,
} from './merma.types';

/**
 * @description Builds a URL query string from merma filter/pagination parameters.
 * @param {MermasQueryParams} [params] - Optional filter and sort options.
 * @returns {string} A query string prefixed with `?`, or an empty string.
 */
function buildMermasQueryString(params?: MermasQueryParams): string {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.sortBy) search.set('sortBy', params.sortBy);
  if (params?.order) search.set('order', params.order);
  if (params?.motivo) search.set('motivo', params.motivo);
  if (params?.startDate) search.set('startDate', params.startDate);
  if (params?.endDate) search.set('endDate', params.endDate);

  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/**
 * @description Fetches a paginated list of merma (waste) records.
 * @param {MermasQueryParams} [params] - Optional filter, sort, and pagination options.
 * @returns {Promise<PaginatedData<Merma>>} Paginated merma records.
 * @throws {Error} When the API returns a non-OK response.
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
  return body.data;
}

/**
 * @description Creates a new merma record for a manual waste entry.
 * @param {CreateMermaPayload} payload - Merma data including product, quantity, and reason.
 * @returns {Promise<Merma>} The created merma record.
 * @throws {Error} When the API returns an error response.
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
 * @description Reports a waste event that originated from a production run.
 * @param {CreateMermaProduccionPayload} payload - Produccion-linked merma data.
 * @returns {Promise<Merma>} The created merma record.
 * @throws {Error} When the API returns an error response.
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
 * @description Fetches aggregated merma statistics (totals by category, time period, etc.).
 * @returns {Promise<MermaStats>} The current merma statistics.
 * @throws {Error} When the API returns a non-OK response.
 */
export async function fetchMermaStats(): Promise<MermaStats> {
  const response = await baseFetch('/merma/stats');
  if (!response.ok) {
    throw new Error(
      `Error al obtener estadísticas de merma: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<MermaStats>;
  return body.data;
}
