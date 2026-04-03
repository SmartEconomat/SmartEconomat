import { baseFetch, PaginatedData, parseApiResponse } from './api.service';
import type {
  CreateDistribucionPayload,
  Distribucion,
  DistribucionDisponible,
} from './distribucion.types';

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

export async function fetchDistribucionById(id: string): Promise<Distribucion> {
  const response = await baseFetch(`/distribuciones/${id}`);
  const body = await parseApiResponse<Distribucion>(
    response,
    'No se pudo obtener el detalle de la distribución'
  );

  return body.data;
}
