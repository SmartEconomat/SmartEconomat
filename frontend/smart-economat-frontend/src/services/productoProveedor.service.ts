import { baseFetch } from './api.service';

export interface ProductoProveedorOption {
    id: string;
    productoNombre: string;
    productoId?: string;
    proveedorNombre: string;
    proveedorId?: string;
    marca?: string;
    codigoBarras?: string;
    label: string;
}

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export async function searchProductoProveedor(q: string, limit: number = 20, offset: number = 0): Promise<ProductoProveedorOption[]> {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    params.set('limit', String(limit));
    params.set('offset', String(offset));

    const response = await baseFetch(`/producto-proveedor/search?${params.toString()}`);
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Error al buscar producto/proveedor: ${response.status}`);
    }

    const body = await response.json() as ApiResponse<Array<{
        id: string;
        productoNombre: string;
        productoId?: string;
        proveedorNombre: string;
        proveedorId?: string;
        marca?: string;
        codigoBarras?: string;
    }>>;

    const rows = body.data ?? [];
    return rows.map((r) => ({
        ...r,
        label: `${r.productoNombre} (${r.proveedorNombre})${r.marca ? ` - ${r.marca}` : ''}`,
    }));
}

