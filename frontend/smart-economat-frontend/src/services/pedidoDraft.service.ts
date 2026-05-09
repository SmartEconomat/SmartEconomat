import { baseFetch, parseApiResponse } from './api.service';
import { PurchaseBatch } from './pedido.types';

const BASE_PATH = '/pedido/draft';

/** Contrato de tipos público (PedidoDraftRecord). Contexto: smart-economat-frontend (SPA). */
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
 * Crea o actualiza el borrador de pedido del usuario actual.
 * @param payload Estado completo del borrador del wizard.
 * @param version Versión para control de concurrencia optimista.
 */
/**
 * Expone "upsertPedidoDraft" en smart-economat-frontend (SPA).
 * @undefined {Record<string, unknown>} payload - Entrada efectiva esperada por el contrato.
 * @undefined {number | undefined} version - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PedidoDraftRecord>} Datos efectivos después de ejecutar la operación.
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
 * Recupera el borrador de pedido más reciente del usuario actual.
 */
/**
 * Expone "fetchLatestPedidoDraft" en smart-economat-frontend (SPA).
 * @undefined {Promise<PedidoDraftRecord | null>} Datos efectivos después de ejecutar la operación.
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
 * Elimina el borrador activo del pedido.
 */
/**
 * Elimina o marca entidades siguendo las políticas configuradas.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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
 * Finaliza el borrador persistido y genera el lote de compra (PurchaseBatch) definitivo.
 */
/**
 * Expone "finalizePedidoFromDraft" en smart-economat-frontend (SPA).
 * @undefined {Promise<PurchaseBatch>} Datos efectivos después de ejecutar la operación.
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
