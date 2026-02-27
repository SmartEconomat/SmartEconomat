import { Receta } from './receta.types';

const API_BASE = '/api/v1';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export async function fetchRecetas(): Promise<Receta[]> {
    const response = await fetch(`${API_BASE}/recetas`);
    if (!response.ok) {
        throw new Error(`Error al obtener recetas: ${response.status} ${response.statusText}`);
    }
    const body = await response.json() as ApiResponse<Receta[]>;
    // El backend de recetas puede devolver el array directamente o envuelto en data
    return Array.isArray(body) ? body : (body.data ?? []);
}

export async function createReceta(receta: Partial<Receta>): Promise<Receta> {
    const response = await fetch(`${API_BASE}/recetas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receta),
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(errorBody.message || `Error al crear receta: ${response.status}`);
    }
    const body = await response.json() as ApiResponse<Receta>;
    return body.data ?? body as unknown as Receta;
}

export async function updateReceta(id: string, receta: Partial<Receta>): Promise<Receta> {
    const response = await fetch(`${API_BASE}/recetas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receta),
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(errorBody.message || `Error al actualizar receta: ${response.status}`);
    }
    const body = await response.json() as ApiResponse<Receta>;
    return body.data ?? body as unknown as Receta;
}
