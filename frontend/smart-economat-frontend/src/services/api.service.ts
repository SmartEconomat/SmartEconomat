/**
 * Servicio API genérico y reutilizable.
 * No está acoplado a ninguna entidad del dominio.
 */

const API_BASE = '/api/v1';

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
    const response = await fetch(`${API_BASE}${resourcePath}`, {
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
