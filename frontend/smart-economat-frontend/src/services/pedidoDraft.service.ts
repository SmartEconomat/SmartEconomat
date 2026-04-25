import { baseFetch, parseApiResponse } from './api.service';
import { PurchaseBatch } from './pedido.types';

const BASE_PATH = '/pedido/draft';

export interface PedidoDraftRecord {
  id: string;
  userId: string;
  version: number;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  source: 'redis' | 'database';
}

/**
 * @description Creates or updates the current user's pedido draft in the backend (upsert).
 * @param {Record<string, unknown>} payload - The draft content to persist.
 * @param {number} [version] - Optional version number for optimistic-lock concurrency control.
 * @returns {Promise<PedidoDraftRecord>} The created or updated draft record.
 * @throws {ApiError} When the API returns an error response (including 409 conflicts).
 */
export async function upsertPedidoDraft(
  payload: Record<string, unknown>,
  version?: number
): Promise<PedidoDraftRecord> {
  const response = await baseFetch(BASE_PATH, {
    method: 'POST',
    body: JSON.stringify({ payload, version }),
  });
  const body = await parseApiResponse<PedidoDraftRecord>(
    response,
    'Error al guardar el borrador del pedido'
  );
  return body.data;
}

/**
 * @description Retrieves the most recent pedido draft for the current user.
 * @returns {Promise<PedidoDraftRecord | null>} The latest draft record, or `null` if none exists.
 * @throws {ApiError} When the API returns an unexpected error.
 */
export async function fetchLatestPedidoDraft(): Promise<PedidoDraftRecord | null> {
  const response = await baseFetch(BASE_PATH);
  const body = await parseApiResponse<PedidoDraftRecord | null>(
    response,
    'Error al recuperar el borrador del pedido'
  );
  return body.data;
}

/**
 * @description Deletes the current user's pedido draft from the backend.
 * @returns {Promise<void>}
 * @throws {Error} When the API returns an error response.
 */
export async function deletePedidoDraft(): Promise<void> {
  const response = await baseFetch(BASE_PATH, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Error al eliminar el borrador del pedido');
  }
}

/**
 * @description Finalizes the current pedido draft, creating a purchase batch from its contents.
 * @returns {Promise<PurchaseBatch>} The resulting purchase batch.
 * @throws {ApiError} When the API returns an error response.
 */
export async function finalizePedidoFromDraft(): Promise<PurchaseBatch> {
  const response = await baseFetch(`${BASE_PATH}/finalize`, {
    method: 'POST',
  });
  const body = await parseApiResponse<PurchaseBatch>(
    response,
    'Error al finalizar el pedido desde el borrador'
  );
  return body.data;
}
