import { Movimiento, MovimientosQueryParams } from './movimiento.types';
import { baseFetch, ApiResponse, PaginatedData } from './api.service';

export async function fetchMovimientos(
  params: MovimientosQueryParams = {}
): Promise<PaginatedData<Movimiento>> {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
  if (params.type) {
    if (Array.isArray(params.type)) {
      params.type.forEach((t) => queryParams.append('type', t));
    } else {
      queryParams.append('type', params.type);
    }
  }
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('order', params.sortOrder);

  const response = await baseFetch(`/movimientos?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Error al obtener movimientos: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<
    PaginatedData<Movimiento>
  >;
  return body.data;
}

export async function createMovimiento(
  movimiento: Partial<Movimiento>
): Promise<Movimiento> {
  const response = await baseFetch('/movimientos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(movimiento),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Error al crear movimiento: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<Movimiento>;
  return body.data;
}

export async function updateMovimiento(
  id: string,
  movimiento: Partial<Movimiento>
): Promise<Movimiento> {
  const response = await baseFetch(`/movimientos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(movimiento),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Error al actualizar movimiento: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<Movimiento>;
  return body.data;
}
