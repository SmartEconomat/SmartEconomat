import {
  baseFetch,
  buildQueryParams,
  PaginatedData,
  parseApiResponse,
} from './api.service';
import type {
  CreateDistribucionPayload,
  Distribucion,
  DistribucionDisponible,
} from './distribucion.types';

/**
 * Recupera la lista paginada de distribuciones (entregas a alumnos/aulas).
 */
/**
 * Expone "fetchDistribuciones" en smart-economat-frontend (SPA).
 * @undefined {{ page?: number; limit?: number; searchTerm?: string; estado?: string; }} params - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PaginatedData<Distribucion>>} Datos efectivos después de ejecutar la operación.
 */
export async function fetchDistribuciones(
  params: {
    page?: number;
    limit?: number;
    searchTerm?: string;
    estado?: string;
  } = {}
): Promise<PaginatedData<Distribucion>> {
  const query = buildQueryParams(params, 20, 50);

  const response = await baseFetch(`/distribuciones?${query.toString()}`);
  const body = await parseApiResponse<PaginatedData<Distribucion>>(
    response,
    'No se pudieron obtener las distribuciones'
  );

  return body.data;
}

/**
 * Obtiene los pedidos de usuario disponibles para ser distribuidos (estado correcto).
 */
/**
 * Expone "fetchDistribucionesDisponibles" en smart-economat-frontend (SPA).
 * @undefined {{ limit?: number; searchTerm?: string; }} params - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<DistribucionDisponible[]>} Datos efectivos después de ejecutar la operación.
 */
export async function fetchDistribucionesDisponibles(
  params: {
    limit?: number;
    searchTerm?: string;
  } = {}
): Promise<DistribucionDisponible[]> {
  const query = buildQueryParams(
    {
      limit: params.limit ? Math.min(params.limit, 50) : undefined,
      search: params.searchTerm,
    },
    20,
    50
  );

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
 * Crea un nuevo registro de distribución (entrega física de productos a un destinatario).
 */
/**
 * Crea recursos nuevos en base a las reglas de negocio.
 * @undefined {CreateDistribucionPayload} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Distribucion>} Datos efectivos después de ejecutar la operación.
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
 * Confirma la entrega de una distribución, actualizando su estado a 'entregado'.
 */
/**
 * Expone "confirmDistribucion" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Distribucion>} Datos efectivos después de ejecutar la operación.
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
 * Cancela una distribución con un motivo opcional.
 */
/**
 * Expone "cancelDistribucion" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {string | undefined} motivoCancelacion - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Distribucion>} Datos efectivos después de ejecutar la operación.
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
 * Obtiene el detalle completo de una distribución por su ID.
 */
/**
 * Expone "fetchDistribucionById" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Distribucion>} Datos efectivos después de ejecutar la operación.
 */
export async function fetchDistribucionById(id: string): Promise<Distribucion> {
  const response = await baseFetch(`/distribuciones/${id}`);
  const body = await parseApiResponse<Distribucion>(
    response,
    'No se pudo obtener el detalle de la distribución'
  );

  return body.data;
}
