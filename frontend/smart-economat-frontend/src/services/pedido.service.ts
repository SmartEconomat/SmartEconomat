import { Pedido } from './pedido.types';
import { baseFetch } from './api.service';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function fetchPedidos(): Promise<Pedido[]> {
  const response = await baseFetch('/pedidos');
  if (!response.ok) {
    throw new Error(
      `Error al obtener pedidos: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<Pedido[]>;
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
