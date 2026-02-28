import { Producto } from './producto.types';
import { baseFetch, ApiResponse, unwrapList } from './api.service';

export async function fetchProductos(): Promise<Producto[]> {
    const response = await baseFetch('/productos?limit=500');
    if (!response.ok) {
        throw new Error(`Error al obtener productos: ${response.status} ${response.statusText}`);
    }
    const body = await response.json() as ApiResponse<unknown>;
    return unwrapList<Producto>(body.data);
}

export async function createProducto(producto: Partial<Producto>): Promise<Producto> {
    const response = await baseFetch('/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(producto),
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Error al crear producto: ${response.status}`);
    }
    const body = await response.json() as ApiResponse<Producto>;
    return body.data;
}

export async function updateProducto(id: string, producto: Partial<Producto>): Promise<Producto> {
    const response = await baseFetch(`/productos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(producto),
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Error al actualizar producto: ${response.status}`);
    }
    const body = await response.json() as ApiResponse<Producto>;
    return body.data;
}
