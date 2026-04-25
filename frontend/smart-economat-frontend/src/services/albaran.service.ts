import {
  Albaran,
  AlbaranQueryParams,
  CreateAlbaranDto,
  UpdateAlbaranDto,
} from './albaran.types';
import { baseFetch, ApiResponse, PaginatedData } from './api.service';

/**
 * Fetches a paginated list of albaranes (delivery notes).
 *
 * @param {AlbaranQueryParams} params - Pagination, search and sort options.
 * @returns {Promise<PaginatedData<Albaran>>} Paginated list of albaranes.
 * @throws {Error} If the API returns a non-OK response.
 * @example
 * const result = await fetchAlbaranes({ page: 1, limit: 10 });
 */
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

/**
 * Fetches a single albaran by its unique identifier.
 *
 * @param {string} id - The albaran UUID.
 * @returns {Promise<Albaran>} The requested albaran.
 * @throws {Error} If the albaran is not found or the API returns an error.
 * @example
 * const albaran = await fetchAlbaranById('abc-123');
 */
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

/**
 * Creates a new albaran.
 *
 * @param {CreateAlbaranDto} dto - Data for the new albaran.
 * @returns {Promise<Albaran>} The created albaran.
 * @throws {Error} If the API returns an error response.
 * @example
 * const albaran = await createAlbaran({ nAlbaran: 'ALB-001', concordancia: true });
 */
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

/**
 * Partially updates an existing albaran.
 *
 * @param {string} id - The albaran UUID to update.
 * @param {UpdateAlbaranDto} dto - Fields to update.
 * @returns {Promise<Albaran>} The updated albaran.
 * @throws {Error} If the API returns an error response.
 * @example
 * const updated = await updateAlbaran('abc-123', { concordancia: false });
 */
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

/**
 * Soft-deletes an albaran by its unique identifier.
 *
 * @param {string} id - The albaran UUID to remove.
 * @returns {Promise<void>}
 * @throws {Error} If the API returns an error response.
 * @example
 * await removeAlbaran('abc-123');
 */
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

/**
 * Uploads a scanned document and associates it with a new or existing albaran.
 *
 * @param {File} file - The document file to upload.
 * @param {string} numeroReferencia - The delivery note reference number.
 * @param {string} [recepcionId] - Optional reception UUID to link.
 * @param {string} [observaciones] - Optional free-text observations.
 * @returns {Promise<Albaran>} The albaran created or updated with the document.
 * @throws {Error} If the upload or API call fails.
 * @example
 * const albaran = await uploadDocumentoAlbaran(file, 'ALB-001', recepcionId);
 */
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
