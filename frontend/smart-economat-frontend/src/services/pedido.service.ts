import { Pedido } from './pedido.types';
import { baseFetch, ApiResponse, PaginatedData } from './api.service';

export async function fetchPedidos(page: number = 1, limit: number = 10, search: string = ''): Promise<PaginatedData<Pedido>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (search) params.append('searchTerm', search);

  const response = await baseFetch(`/pedidos?${params.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Error al obtener pedidos: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<PaginatedData<Pedido>>;
  return body.data;
}

export async function createPedido(pedido: Partial<Pedido>): Promise<Pedido> {
  const response = await baseFetch('/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedido),
  });

  if (!response.ok) {
    let errorDetail: any = {};
    try {
      errorDetail = await response.json();
    } catch (e) {
      // ignore JSON parse errors
    }
    throw new Error(
      errorDetail?.message || `Error al crear pedido: ${response.status}`
    );
  }

  const body = (await response.json()) as ApiResponse<Pedido>;
  return body.data;
}

export async function updatePedido(
  id: string,
  pedido: Partial<Pedido>
): Promise<Pedido> {
  const response = await baseFetch(`/pedidos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedido),
  });

  if (!response.ok) {
    let errorDetail: any = {};
    try {
      errorDetail = await response.json();
    } catch (e) {}
    throw new Error(
      errorDetail?.message || `Error al actualizar pedido: ${response.status}`
    );
  }

  const body = (await response.json()) as ApiResponse<Pedido>;
  return body.data;
}
