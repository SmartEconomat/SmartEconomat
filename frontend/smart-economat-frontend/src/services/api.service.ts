import { eventBus, AUTH_EVENTS } from '../utils/eventBus';

/**
 * Servicio API genérico y reutilizable con manejo global de errores.
 */

const API_BASE = '/api/v1';

// ─── Tipos compartidos de la API ────────────────────────────────────────────

/**
 * Envoltorio estándar del interceptor global del backend.
 * Todos los endpoints devuelven `{ success, message, data }`.
 */
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

/**
 * Forma que devuelven los endpoints paginados del backend.
 * Las respuestas de listado tienen la forma `{ data: T[], total, page, limit, totalPages }`.
 */
export interface PaginatedData<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * Extrae el array de items de una respuesta que puede ser:
 *  - Un array directo: `T[]`
 *  - Un wrapper paginado: `PaginatedData<T>` (donde los items están en `.data`)
 *
 * Esto es necesario porque el interceptor global envuelve la respuesta en
 * `{ success, message, data }`, y los endpoints paginados añaden otro nivel:
 * `{ data: { data: T[], total, page, ... } }`.
 */
export function unwrapList<T>(payload: unknown): T[] {
    if (Array.isArray(payload)) return payload as T[];
    const paginated = payload as PaginatedData<T> | null | undefined;
    if (paginated != null && Array.isArray(paginated.data)) return paginated.data;
    return [];
}

// ─── Helpers de fetch ───────────────────────────────────────────────────────

/**
 * Wrapper de fetch que maneja errores comunes (como 401 Unauthorized).
 */
export async function baseFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('token');
    const headers = new Headers(options.headers);
    
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    
    if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        eventBus.emit(AUTH_EVENTS.UNAUTHORIZED);
        throw new Error('Sesión expirada o no autorizada');
    }

    return response;
}

/**
 * Elimina un recurso en la API mediante su ruta relativa.
 *
 * @param resourcePath - Ruta relativa al recurso, p. ej. `/productos/abc-123`
 * @throws Error si la respuesta HTTP no es 2xx (excepto 204)
 *
 * @example
 * await deleteResource(`/productos/${id}`);
 * await deleteResource(`/proveedores/${id}`);
 */
export async function deleteResource(resourcePath: string): Promise<void> {
    const response = await baseFetch(resourcePath, {
        method: 'DELETE',
    });

    // 204 No Content es éxito sin cuerpo
    if (!response.ok) {
        let detail = `${response.status} ${response.statusText}`;
        try {
            const body = await response.json() as { message?: string };
            if (body.message) detail = body.message;
        } catch {
            // la respuesta no tiene cuerpo JSON, usamos el status
        }
        throw new Error(detail);
    }
}
