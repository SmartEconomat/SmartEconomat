import { Pedido } from './pedido.types';
import { baseFetch, PaginatedData } from './api.service';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PedidoRequestPayload {
  proveedorId: string;
  fechaEntrega: string;
  costeTotal?: number;
  estado?: string;
  motivoCancelacion?: string;
  lineas: Array<{
    productoProveedorId: string;
    cantidad: number;
  }>;
}

export async function fetchPedidos(
  page: number = 1,
  limit: number = 10,
  searchTerm: string = ''
): Promise<PaginatedData<Pedido>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (searchTerm.trim()) params.set('searchTerm', searchTerm.trim());

  const response = await baseFetch(`/pedidos?${params.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Error al obtener pedidos: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<PaginatedData<Pedido>>;
  return body.data;
}

export async function createPedido(
  pedido: PedidoRequestPayload
): Promise<Pedido> {
  const response = await baseFetch('/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedido),
  });

  if (!response.ok) {
    let errorMessage = `Error al crear pedido: ${response.status}`;
    try {
      const errorDetail = (await response.json()) as { message?: string };
      if (errorDetail?.message) errorMessage = errorDetail.message;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const body = (await response.json()) as ApiResponse<Pedido>;
  return body.data;
}

export async function updatePedido(
  id: string,
  pedido: Partial<PedidoRequestPayload>
): Promise<Pedido> {
  const response = await baseFetch(`/pedidos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedido),
  });

  if (!response.ok) {
    let errorMessage = `Error al actualizar pedido: ${response.status}`;
    try {
      const errorDetail = (await response.json()) as { message?: string };
      if (errorDetail?.message) errorMessage = errorDetail.message;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const body = (await response.json()) as ApiResponse<Pedido>;
  return body.data;
}
