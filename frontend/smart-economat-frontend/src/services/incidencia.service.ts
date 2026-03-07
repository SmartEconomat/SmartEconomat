import { Incidencia, IncidenciasQueryParams } from './incidencia.types';
import { baseFetch, ApiResponse, PaginatedData } from './api.service';

export async function fetchIncidencias(params: IncidenciasQueryParams = {}): Promise<PaginatedData<Incidencia>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.resuelta !== undefined) queryParams.append('resuelta', params.resuelta.toString());
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const response = await baseFetch(`/incidencias?${queryParams.toString()}`);
    if (!response.ok) {
        throw new Error(`Error al obtener incidencias: ${response.status} ${response.statusText}`);
    }
    const body = await response.json() as ApiResponse<PaginatedData<Incidencia>>;
    
    // El backend puede devolver Incidencia[] directamente si no está paginado, 
    // pero el DTO parece sugerir que el controlador devuelve Promise<Incidencia[]>.
    // Vamos a ver si el controlador de incidencias usa paginación.
    
    if (Array.isArray(body.data)) {
        return {
            data: body.data,
            total: body.data.length,
            page: 1,
            limit: body.data.length,
            totalPages: 1
        };
    }
    
    return body.data;
}

export async function resolveIncidencia(id: string, dto: { observacionesResolucion?: string }): Promise<Incidencia> {
    const response = await baseFetch(`/incidencias/${id}/resolver`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Error al resolver incidencia: ${response.status}`);
    }
    const body = await response.json() as ApiResponse<Incidencia>;
    return body.data;
}

export async function removeIncidencia(id: string): Promise<void> {
    const response = await baseFetch(`/incidencias/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Error al eliminar incidencia: ${response.status}`);
    }
}
