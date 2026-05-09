import {
  Albaran,
  AlbaranQueryParams,
  CreateAlbaranDto,
  UpdateAlbaranDto,
} from './albaran.types';
import {
  baseFetch,
  ApiResponse,
  buildQueryParams,
  PaginatedData,
} from './api.service';

/**
 * Recupera una lista paginada de albaranes de entrega.
 */
/**
 * Expone "fetchAlbaranes" en smart-economat-frontend (SPA).
 * @undefined {AlbaranQueryParams} params - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PaginatedData<Albaran>>} Datos efectivos después de ejecutar la operación.
 */
export async function fetchAlbaranes(
  params: AlbaranQueryParams = {}
): Promise<PaginatedData<Albaran>> {
  const queryParams = buildQueryParams(
    {
      page: params.page,
      limit: params.limit,
      search: params.searchTerm,
      sortBy: params.sortBy,
      order: params.order,
    },
    20,
    50
  );

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
 * Obtiene el detalle completo de un albarán por su ID.
 */
/**
 * Expone "fetchAlbaranById" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Albaran>} Datos efectivos después de ejecutar la operación.
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
 * Crea un nuevo albarán de entrega.
 */
/**
 * Crea recursos nuevos en base a las reglas de negocio.
 * @undefined {CreateAlbaranDto} dto - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Albaran>} Datos efectivos después de ejecutar la operación.
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
 * Actualiza la información de un albarán existente.
 */
/**
 * Persiste modificaciones válidas sobre entidades existentes.
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Partial<CreateAlbaranDto>} dto - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Albaran>} Datos efectivos después de ejecutar la operación.
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
 * Elimina un albarán del sistema.
 */
/**
 * Expone "removeAlbaran" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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
 * Sube un documento físico (PDF/imagen) vinculado a un albarán,
 * creando automáticamente el registro de albarán si no existe.
 */
/**
 * Expone "uploadDocumentoAlbaran" en smart-economat-frontend (SPA).
 * @undefined {File} file - Entrada efectiva esperada por el contrato.
 * @undefined {string} numeroReferencia - Entrada efectiva esperada por el contrato.
 * @undefined {string | undefined} recepcionId - Entrada efectiva esperada por el contrato.
 * @undefined {string | undefined} observaciones - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Albaran>} Datos efectivos después de ejecutar la operación.
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
