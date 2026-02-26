import { Pedido } from './pedido.types';

const API_BASE = '/api/v1';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export async function fetchPedidos(): Promise<Pedido[]> {
    const response = await fetch(`${API_BASE}/pedidos`);
    if (!response.ok) {
        throw new Error(`Error al obtener pedidos: ${response.status} ${response.statusText}`);
    }
    const body = await response.json() as ApiResponse<Pedido[]>;
    return body.data;
}

export async function createPedido(pedido: Partial<Pedido>): Promise<Pedido> {
    const response = await fetch(`${API_BASE}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido),
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Error al crear pedido: ${response.status}`);
    }
    const body = await response.json() as ApiResponse<Pedido>;
    return body.data;
}

export async function updatePedido(id: string, pedido: Partial<Pedido>): Promise<Pedido> {
    const response = await fetch(`${API_BASE}/pedidos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido),
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Error al actualizar pedido: ${response.status}`);
    }
    const body = await response.json() as ApiResponse<Pedido>;
    return body.data;
}
