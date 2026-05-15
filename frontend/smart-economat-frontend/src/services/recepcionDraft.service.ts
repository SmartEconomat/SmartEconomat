import { ApiResponse, baseFetch, parseApiResponse } from './api.service';
import { RecepcionDraft, RecepcionDraftEnvelope } from './recepcion.types';

/**
 * Expone "fetchRecepcionDraft" en smart-economat-frontend (SPA).
 * @undefined {Promise<RecepcionDraftEnvelope | null>} Datos efectivos después de ejecutar la operación.
 */
export async function fetchRecepcionDraft(): Promise<RecepcionDraftEnvelope | null> {
  const response = await baseFetch('/recepciones/draft');
  const body = await parseApiResponse<RecepcionDraftEnvelope | null>(
    response,
    'No se pudo recuperar el borrador de recepción.'
  );

  return body.data;
}

/**
 * Expone "saveRecepcionDraft" en smart-economat-frontend (SPA).
 * @undefined {RecepcionDraft} draft - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<RecepcionDraftEnvelope>} Datos efectivos después de ejecutar la operación.
 */
export async function saveRecepcionDraft(
  draft: RecepcionDraft
): Promise<RecepcionDraftEnvelope> {
  const response = await baseFetch('/recepciones/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payload: draft,
      version: draft.serverVersion ?? undefined,
    }),
  });

  const body = await parseApiResponse<RecepcionDraftEnvelope>(
    response,
    'No se pudo guardar el borrador de recepción.'
  );

  return body.data;
}

/**
 * Elimina o marca entidades siguendo las políticas configuradas.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function deleteRecepcionDraft(): Promise<void> {
  const response = await baseFetch('/recepciones/draft', {
    method: 'DELETE',
  });

  if (response.status === 204) {
    return;
  }

  await parseApiResponse<ApiResponse<null>>(
    response,
    'No se pudo eliminar el borrador de recepción.'
  );
}
