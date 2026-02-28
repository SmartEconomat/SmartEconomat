import { Recepcion } from './recepcion.types';
import { baseFetch, ApiResponse, unwrapList } from './api.service';

export async function fetchRecepciones(): Promise<Recepcion[]> {
    const response = await baseFetch('/recepcion?limit=500');
    if (!response.ok) {
        throw new Error(`Error al obtener recepciones: ${response.status} ${response.statusText}`);
    }
    const body = await response.json() as ApiResponse<unknown>;
    return unwrapList<Recepcion>(body.data);
}

export async function createRecepcion(recepcion: Partial<Recepcion>): Promise<Recepcion> {
    const response = await baseFetch('/recepcion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recepcion),
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Error al crear recepción: ${response.status}`);
    }
    const body = await response.json() as ApiResponse<Recepcion>;
    return body.data;
}

export async function updateRecepcion(id: string, recepcion: Partial<Recepcion>): Promise<Recepcion> {
    const response = await baseFetch(`/recepcion/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recepcion),
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Error al actualizar recepción: ${response.status}`);
    }
    const body = await response.json() as ApiResponse<Recepcion>;
    return body.data;
}
