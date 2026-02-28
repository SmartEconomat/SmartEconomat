import { Proveedor } from './proveedor.types';
import { baseFetch } from './api.service';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export async function fetchProveedores(): Promise<Proveedor[]> {
    const response = await baseFetch('/proveedor');
    if (!response.ok) {
        throw new Error(`Error al obtener proveedores: ${response.status} ${response.statusText}`);
    }
    const body = await response.json() as ApiResponse<Proveedor[]>;
    return body.data;
}

export async function createProveedor(proveedor: Partial<Proveedor>): Promise<Proveedor> {
    const response = await baseFetch('/proveedor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proveedor),
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Error al crear proveedor: ${response.status}`);
    }
    const body = await response.json() as ApiResponse<Proveedor>;
    return body.data;
}

export async function updateProveedor(id: string, proveedor: Partial<Proveedor>): Promise<Proveedor> {
    const response = await baseFetch(`/proveedor/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proveedor),
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Error al actualizar proveedor: ${response.status}`);
    }
    const body = await response.json() as ApiResponse<Proveedor>;
    return body.data;
}
