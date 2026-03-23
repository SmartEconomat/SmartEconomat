import {
  Albaran,
  AlbaranQueryParams,
  CreateAlbaranDto,
  UpdateAlbaranDto,
} from './albaran.types';
import { baseFetch, ApiResponse, PaginatedData } from './api.service';

export async function fetchAlbaranes(
  params: AlbaranQueryParams = {}
): Promise<PaginatedData<Albaran>> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.order) queryParams.append('order', params.order);

  const response = await baseFetch(`/albaranes?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Error al obtener albaranes: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<PaginatedData<Albaran>>;

  if (Array.isArray(body.data)) {
    const list = body.data as Albaran[];
    return {
      data: list,
      total: list.length,
      page: 1,
      limit: list.length,
      totalPages: 1,
    };
  }

  return body.data;
}

export async function fetchAlbaranById(id: string): Promise<Albaran> {
  const response = await baseFetch(`/albaranes/${id}`);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      (errorBody as { message?: string }).message ||
        `Error al obtener albarán: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<Albaran>;
  return body.data;
}

export async function createAlbaran(dto: CreateAlbaranDto): Promise<Albaran> {
  const response = await baseFetch('/albaranes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      (errorBody as { message?: string }).message ||
        `Error al crear albarán: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<Albaran>;
  return body.data;
}

export async function updateAlbaran(
  id: string,
  dto: UpdateAlbaranDto
): Promise<Albaran> {
  const response = await baseFetch(`/albaranes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      (errorBody as { message?: string }).message ||
        `Error al actualizar albarán: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<Albaran>;
  return body.data;
}

export async function removeAlbaran(id: string): Promise<void> {
  const response = await baseFetch(`/albaranes/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      (errorBody as { message?: string }).message ||
        `Error al eliminar albarán: ${response.status}`
    );
  }
}

export async function uploadDocumentoAlbaran(
  file: File,
  numeroReferencia: string,
  recepcionId?: string,
  observaciones?: string
): Promise<Albaran> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('numeroReferencia', numeroReferencia);
  if (recepcionId?.trim()) formData.append('recepcionId', recepcionId.trim());
  if (observaciones?.trim())
    formData.append('observaciones', observaciones.trim());

  const response = await baseFetch('/albaranes/upload-documento', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      (errorBody as { message?: string }).message ||
        `Error al subir documento: ${response.status}`
    );
  }
  // El backend devuelve { message, data: Albaran }, que el interceptor envuelve en
  // { success, message, data: { message, data: Albaran } }
  const body = (await response.json()) as ApiResponse<{
    message: string;
    data: Albaran;
  }>;
  return body.data.data;
}
