import { Producto } from './producto.types';
import { baseFetch, ApiResponse, PaginatedData } from './api.service';

export async function fetchProductos(page: number = 1, limit: number = 10, search: string = ''): Promise<PaginatedData<Producto>> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });
    if (search) params.append('searchTerm', search);

    const response = await baseFetch(`/productos?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`Error al obtener productos: ${response.status} ${response.statusText}`);
    }
    const body = await response.json() as ApiResponse<PaginatedData<Producto>>;
    return body.data;
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

export async function getProductoByBarcode(barcode: string): Promise<Producto | null> {
    const response = await baseFetch(`/productos?codigoBarras=${barcode}`);
    if (!response.ok) return null;
    const body = await response.json() as ApiResponse<PaginatedData<Producto>>;
    const list = body.data.data;
    return list.length > 0 ? list[0] : null;
}

export async function searchProductosByName(name: string): Promise<Producto[]> {
    const response = await baseFetch(`/productos?searchTerm=${name}&limit=10`);
    if (!response.ok) return [];
    const body = await response.json() as ApiResponse<PaginatedData<Producto>>;
    return body.data.data;
}
