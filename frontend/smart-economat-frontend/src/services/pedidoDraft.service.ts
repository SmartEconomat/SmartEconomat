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
 * Documentación en español.
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
 * Documentación en español.
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
 * Documentación en español.
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
 * Documentación en español.
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
