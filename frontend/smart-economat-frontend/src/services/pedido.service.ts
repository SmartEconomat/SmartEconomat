import { Pedido } from './pedido.types';
import { baseFetch, PaginatedData } from './api.service';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PedidoLinePayload {
  productoProveedorId: string;
  cantidad: number;
}

export interface CreatePedidoPayload {
  proveedorId: string;
  observaciones?: string;
  lineas: PedidoLinePayload[];
}

export interface UpdatePedidoPayload {
  proveedorId?: string;
  observaciones?: string;
  lineas?: PedidoLinePayload[];
}

export interface CancelPedidoPayload {
  motivoCancelacion: string;
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
  pedido: CreatePedidoPayload
): Promise<Pedido> {
  const response = await baseFetch('/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedido),
  });

  if (!response.ok) {
<<<<<<< HEAD
    let errorMessage = `Error al crear pedido: ${response.status}`;
    try {
      const errorDetail = (await response.json()) as { message?: string };
      if (errorDetail?.message) errorMessage = errorDetail.message;
    } catch {
      // ignore
=======
    let errorDetail: { message?: string } = {};
    try {
      errorDetail = await response.json();
    } catch {
      // ignore JSON parse errors
>>>>>>> 2289ced (refactor(pedido): alineación total frontend-backend, tests y UI)
    }
    throw new Error(errorMessage);
  }

  const body = (await response.json()) as ApiResponse<Pedido>;
  return body.data;
}

export async function updatePedido(
  id: string,
  pedido: UpdatePedidoPayload
): Promise<Pedido> {
  const response = await baseFetch(`/pedidos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedido),
  });

  if (!response.ok) {
<<<<<<< HEAD
    let errorMessage = `Error al actualizar pedido: ${response.status}`;
    try {
      const errorDetail = (await response.json()) as { message?: string };
      if (errorDetail?.message) errorMessage = errorDetail.message;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
=======
    let errorDetail: { message?: string } = {};
    try {
      errorDetail = await response.json();
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(
      errorDetail?.message || `Error al actualizar pedido: ${response.status}`
    );
>>>>>>> 2289ced (refactor(pedido): alineación total frontend-backend, tests y UI)
  }

  const body = (await response.json()) as ApiResponse<Pedido>;
  return body.data;
}

export async function cancelPedido(
  id: string,
  payload: CancelPedidoPayload
): Promise<Pedido> {
  const response = await baseFetch(`/pedidos/${id}/cancelar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail: { message?: string } = {};
    try {
      errorDetail = await response.json();
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(
      errorDetail?.message || `Error al cancelar pedido: ${response.status}`
    );
  }

  const body = (await response.json()) as ApiResponse<Pedido>;
  return body.data;
}
