import { baseFetch, PaginatedData, parseApiResponse } from './api.service';
import type {
  CreateDistribucionPayload,
  Distribucion,
  DistribucionDisponible,
} from './distribucion.types';

/**
 * Fetches a paginated list of distribution records.
 *
 * @param {{ page?: number; limit?: number; searchTerm?: string; estado?: string }} params - Filter and pagination options.
 * @returns {Promise<PaginatedData<Distribucion>>} Paginated distributions.
 * @throws {ApiError} If the API returns an error response.
 * @example
 * const result = await fetchDistribuciones({ page: 1, estado: 'preparacion' });
 */
export async function fetchDistribuciones(
  params: {
    page?: number;
    limit?: number;
    searchTerm?: string;
    estado?: string;
  } = {}
): Promise<PaginatedData<Distribucion>> {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.searchTerm) query.set('searchTerm', params.searchTerm);
  if (params.estado) query.set('estado', params.estado);

  const response = await baseFetch(`/distribuciones?${query.toString()}`);
  const body = await parseApiResponse<PaginatedData<Distribucion>>(
    response,
    'No se pudieron obtener las distribuciones'
  );

  return body.data;
}

/**
 * Fetches the list of pedido-usuarios available for distribution (not yet fully distributed).
 *
 * @param {{ limit?: number; searchTerm?: string }} params - Optional filter options.
 * @returns {Promise<DistribucionDisponible[]>} List of distributable orders.
 * @throws {ApiError} If the API returns an error response.
 * @example
 * const orders = await fetchDistribucionesDisponibles({ searchTerm: 'Juan' });
 */
export async function fetchDistribucionesDisponibles(
  params: {
    limit?: number;
    searchTerm?: string;
  } = {}
): Promise<DistribucionDisponible[]> {
  const query = new URLSearchParams();

  if (params.limit) query.set('limit', String(Math.min(params.limit, 50)));
  if (params.searchTerm) query.set('searchTerm', params.searchTerm);

  const response = await baseFetch(
    `/distribuciones/disponibles?${query.toString()}`
  );
  const body = await parseApiResponse<DistribucionDisponible[]>(
    response,
    'No se pudieron obtener los pedidos distribuibles'
  );

  return body.data;
}

/**
 * Creates a new distribution record for a pedido-usuario.
 *
 * @param {CreateDistribucionPayload} payload - Distribution details and product lines.
 * @returns {Promise<Distribucion>} The created distribution record.
 * @throws {ApiError} If the API returns an error response.
 * @example
 * const dist = await createDistribucion({ pedidoUsuarioId: 'abc', lineas: [...] });
 */
export async function createDistribucion(
  payload: CreateDistribucionPayload
): Promise<Distribucion> {
  const response = await baseFetch('/distribuciones', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const body = await parseApiResponse<Distribucion>(
    response,
    'No se pudo registrar la entrega'
  );

  return body.data;
}

/**
 * Marks a distribution as confirmed (delivered to the recipient).
 *
 * @param {string} id - The distribution UUID to confirm.
 * @returns {Promise<Distribucion>} The updated distribution record.
 * @throws {ApiError} If the API returns an error response.
 * @example
 * const dist = await confirmDistribucion('abc-123');
 */
export async function confirmDistribucion(id: string): Promise<Distribucion> {
  const response = await baseFetch(`/distribuciones/${id}/confirmar`, {
    method: 'PATCH',
  });

  const body = await parseApiResponse<Distribucion>(
    response,
    'No se pudo confirmar la entrega'
  );

  return body.data;
}

/**
 * Cancels a distribution, optionally providing a cancellation reason.
 *
 * @param {string} id - The distribution UUID to cancel.
 * @param {string} [motivoCancelacion] - Optional reason for cancellation.
 * @returns {Promise<Distribucion>} The updated distribution record.
 * @throws {ApiError} If the API returns an error response.
 * @example
 * const dist = await cancelDistribucion('abc-123', 'Pedido duplicado');
 */
export async function cancelDistribucion(
  id: string,
  motivoCancelacion?: string
): Promise<Distribucion> {
  const response = await baseFetch(`/distribuciones/${id}/cancelar`, {
    method: 'PATCH',
    body: JSON.stringify({ motivoCancelacion }),
  });

  const body = await parseApiResponse<Distribucion>(
    response,
    'No se pudo cancelar la distribución'
  );

  return body.data;
}

/**
 * Fetches the full detail of a single distribution record by its identifier.
 *
 * @param {string} id - The distribution UUID.
 * @returns {Promise<Distribucion>} The distribution detail.
 * @throws {ApiError} If the API returns an error response.
 * @example
 * const dist = await fetchDistribucionById('abc-123');
 */
export async function fetchDistribucionById(id: string): Promise<Distribucion> {
  const response = await baseFetch(`/distribuciones/${id}`);
  const body = await parseApiResponse<Distribucion>(
    response,
    'No se pudo obtener el detalle de la distribución'
  );

  return body.data;
}
