import { Recepcion } from './recepcion.types';

const API_BASE = '/api/v1';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export async function fetchRecepciones(): Promise<Recepcion[]> {
    const response = await fetch(`${API_BASE}/recepcion`);
    if (!response.ok) {
        throw new Error(`Error al obtener recepciones: ${response.status} ${response.statusText}`);
    }
    const body = await response.json() as ApiResponse<Recepcion[]>;
    return body.data;
}

export async function createRecepcion(recepcion: Partial<Recepcion>): Promise<Recepcion> {
    const response = await fetch(`${API_BASE}/recepcion`, {
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
    const response = await fetch(`${API_BASE}/recepcion/${id}`, {
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
