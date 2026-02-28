import { Proveedor } from './proveedor.types';
import { baseFetch, ApiResponse, PaginatedData } from './api.service';

export async function fetchProveedores(page: number = 1, limit: number = 10, search: string = ''): Promise<PaginatedData<Proveedor>> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });
    if (search) params.append('searchTerm', search);

    const response = await baseFetch(`/proveedor?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`Error al obtener proveedores: ${response.status} ${response.statusText}`);
    }
    const body = await response.json() as ApiResponse<PaginatedData<Proveedor>>;
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
