import { baseFetch, ApiResponse, PaginatedData } from './api.service';
import {
  Merma,
  CreateMermaPayload,
  MermaStats,
  MermasQueryParams,
} from './merma.types';

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
