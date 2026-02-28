import { Movimiento } from './movimiento.types';
import { baseFetch, ApiResponse, PaginatedData } from './api.service';

export async function fetchMovimientos(page: number = 1, limit: number = 10): Promise<PaginatedData<Movimiento>> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    const response = await baseFetch(`/movimientos?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`Error al obtener movimientos: ${response.status} ${response.statusText}`);
    }
    const body = await response.json() as ApiResponse<PaginatedData<Movimiento>>;
    return body.data;
}

export async function createMovimiento(movimiento: Partial<Movimiento>): Promise<Movimiento> {
    const response = await baseFetch('/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movimiento),
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Error al crear movimiento: ${response.status}`);
    }
    const body = await response.json() as ApiResponse<Movimiento>;
    return body.data;
}

export async function updateMovimiento(id: string, movimiento: Partial<Movimiento>): Promise<Movimiento> {
    const response = await baseFetch(`/movimientos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movimiento),
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Error al actualizar movimiento: ${response.status}`);
    }
    const body = await response.json() as ApiResponse<Movimiento>;
    return body.data;
}
