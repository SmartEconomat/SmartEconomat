import { CreateRecepcionDto, RecepcionResultado } from './recepcion.types';
import { baseFetch, ApiResponse, unwrapList } from './api.service';

/**
 * Obtiene todas las recepciones registradas en el sistema.
 * El endpoint subyacente devolverá las entidades Recepcion con sus relaciones principales.
 */
export async function fetchRecepciones(): Promise<any[]> {
  const response = await baseFetch('/recepcion?limit=50');
  if (!response.ok) {
    throw new Error(
      `Error al obtener recepciones: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<unknown>;
  return unwrapList<any>(body.data);
}

/**
 * Procesa un lote (Wizard) de recepción contra uno o varios Pedidos.
 * Endpoint atómico. Genera inventario, actualiza pedido y crea incidencias automáticamente.
 */
export async function createRecepcion(
  payload: CreateRecepcionDto
): Promise<RecepcionResultado> {
  const response = await baseFetch('/recepcion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = `Error al registrar recepción: ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody.message)
        errorMsg =
          typeof errorBody.message === 'string'
            ? errorBody.message
            : errorBody.message.join(', ');
    } catch {
      // Fallback to text
    }
    throw new Error(errorMsg);
  }

  const body = (await response.json()) as ApiResponse<RecepcionResultado>;
  return body.data;
}

/**
 * Elimina una nota de entrega / recepción.
 * OJO: El backend actual probablemente impida esto si afecta inventario cerrado.
 */
export async function deleteRecepcion(id: string): Promise<void> {
  const response = await baseFetch(`/recepcion/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    let errorMsg = `Error al eliminar recepción: ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody.message) errorMsg = errorBody.message;
    } catch {}
    throw new Error(errorMsg);
  }
}
