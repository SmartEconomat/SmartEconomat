import { Producto } from './producto.types';

const API_BASE = '/api/v1';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export async function fetchProductos(): Promise<Producto[]> {
    const response = await fetch(`${API_BASE}/productos`);
    if (!response.ok) {
        throw new Error(`Error al obtener productos: ${response.status} ${response.statusText}`);
    }
    const body = await response.json() as ApiResponse<Producto[]>;
    return body.data;
}
