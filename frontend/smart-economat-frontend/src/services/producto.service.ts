import { Producto, ProductosQueryParams } from './producto.types';
import { baseFetch, ApiResponse, PaginatedData } from './api.service';

function buildProductosQueryString(params?: ProductosQueryParams): string {
    if (!params) return '?limit=500';
    const search = new URLSearchParams();
    if (params.page != null) search.set('page', String(params.page));
    if (params.limit != null) search.set('limit', String(params.limit));
    if (params.searchTerm?.trim()) search.set('searchTerm', params.searchTerm.trim());
    if (params.codigoBarras?.trim()) search.set('codigoBarras', params.codigoBarras.trim());
    if (params.tipo) search.set('tipo', params.tipo);
    if (params.alergenos?.length) search.set('alergenos', params.alergenos.join(','));
    const qs = search.toString();
    return qs ? `?${qs}` : '?limit=500';
}

export async function fetchProductos(page: number = 1, limit: number = 10, search: string = ''): Promise<PaginatedData<Producto>> {
    const query = buildProductosQueryString({ page, limit, searchTerm: search });
    const response = await baseFetch(`/productos${query}`);
    if (!response.ok) {
        throw new Error(`Error al obtener productos: ${response.status} ${response.statusText}`);
    }
    const body = await response.json() as ApiResponse<PaginatedData<Producto>>;
    return body.data;
}

export interface ProductosPaginatedResult extends PaginatedData<Producto> {}

export async function fetchProductosPaginated(params?: ProductosQueryParams): Promise<ProductosPaginatedResult> {
    const query = buildProductosQueryString({ limit: 20, ...params });
    const response = await baseFetch(`/productos${query}`);
    if (!response.ok) {
        throw new Error(`Error al obtener productos: ${response.status} ${response.statusText}`);
    }
    const body = await response.json() as ApiResponse<PaginatedData<Producto>>;
    const inner = body.data;
    if (!inner || !Array.isArray(inner.data)) {
        return {
            data: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 1,
        };
    }
    return {
        data: inner.data,
        total: inner.total ?? inner.data.length,
        page: inner.page ?? 1,
        limit: inner.limit ?? 20,
        totalPages: inner.totalPages ?? 1,
    };
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
