import { Pedido, PurchaseBatch } from './pedido.types';
import {
  baseFetch,
  downloadFile,
  PaginatedData,
  printPdfFile,
} from './api.service';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PedidoLinePayload {
  productoProveedorId: string;
  cantidad: number;
}

export interface CreatePedidoPayload {
  proveedorId: string;
  observaciones?: string;
  lineas: PedidoLinePayload[];
}

export interface CreatePurchaseBatchPayload {
  observaciones?: string;
  lineas: PedidoLinePayload[];
}

export interface CreateMissingStockBatchPayload {
  observaciones?: string;
  items: Array<{
    recetaId: string;
    cantidad: number;
  }>;
}

export interface CreatePedidoFromRecetasPayload {
  recetaIds: string[];
  observaciones?: string;
}

export interface UpdatePedidoPayload {
  proveedorId?: string;
  observaciones?: string;
  lineas?: PedidoLinePayload[];
}

export interface CancelPedidoPayload {
  motivoCancelacion: string;
}

export async function fetchPedidos(
  page: number = 1,
  limit: number = 10,
  searchTerm: string = '',
  estado: string = ''
): Promise<PaginatedData<Pedido>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (searchTerm.trim()) params.set('searchTerm', searchTerm.trim());
  if (estado.trim()) params.set('estado', estado.trim());

  const response = await baseFetch(`/pedidos?${params.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Error al obtener pedidos: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<PaginatedData<Pedido>>;
  return body.data;
}

export async function createPedido(
  pedido: CreatePedidoPayload
): Promise<Pedido> {
  const response = await baseFetch('/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedido),
  });

  if (!response.ok) {
    let errorMessage = `Error al crear pedido: ${response.status}`;
    try {
      const errorDetail = (await response.json()) as { message?: string };
      if (errorDetail?.message) errorMessage = errorDetail.message;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const body = (await response.json()) as ApiResponse<Pedido>;
  return body.data;
}

export async function updatePedido(
  id: string,
  pedido: UpdatePedidoPayload
): Promise<Pedido> {
  const response = await baseFetch(`/pedidos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedido),
  });

  if (!response.ok) {
    let errorMessage = `Error al actualizar pedido: ${response.status}`;
    try {
      const errorDetail = (await response.json()) as { message?: string };
      if (errorDetail?.message) errorMessage = errorDetail.message;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const body = (await response.json()) as ApiResponse<Pedido>;
  return body.data;
}

export async function cancelPedido(
  id: string,
  payload: CancelPedidoPayload
): Promise<Pedido> {
  const response = await baseFetch(`/pedidos/${id}/cancelar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail: { message?: string } = {};
    try {
      errorDetail = await response.json();
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(
      errorDetail?.message || `Error al cancelar pedido: ${response.status}`
    );
  }

  const body = (await response.json()) as ApiResponse<Pedido>;
  return body.data;
}

export async function aceptarPedido(id: string): Promise<Pedido> {
  const response = await baseFetch(`/pedidos/${id}/aceptar`, {
    method: 'PATCH',
  });

  if (!response.ok) {
    let errorDetail: { message?: string } = {};
    try {
      errorDetail = await response.json();
    } catch {
      // ignore
    }
    throw new Error(
      errorDetail?.message || `Error al aceptar pedido: ${response.status}`
    );
  }

  const body = (await response.json()) as ApiResponse<Pedido>;
  return body.data;
}

export async function createPurchaseBatch(
  payload: CreatePurchaseBatchPayload
): Promise<PurchaseBatch> {
  const response = await baseFetch('/purchase-batches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Error al crear lote de compra: ${response.status}`;
    try {
      const errorDetail = (await response.json()) as { message?: string };
      if (errorDetail?.message) errorMessage = errorDetail.message;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const body = (await response.json()) as ApiResponse<PurchaseBatch>;
  return body.data;
}

export async function createMissingStockBatch(
  payload: CreateMissingStockBatchPayload
): Promise<PurchaseBatch> {
  const response = await baseFetch('/purchase-batches/from-missing-stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Error al crear pedidos de faltantes: ${response.status}`;
    try {
      const errorDetail = (await response.json()) as { message?: string };
      if (errorDetail?.message) errorMessage = errorDetail.message;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const body = (await response.json()) as ApiResponse<PurchaseBatch>;
  return body.data;
}

export async function createPedidoFromRecetas(
  payload: CreatePedidoFromRecetasPayload
): Promise<Pedido> {
  const response = await baseFetch('/pedidos/from-recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Error al crear pedido desde recetas: ${response.status}`;
    try {
      const errorDetail = (await response.json()) as { message?: string };
      if (errorDetail?.message) errorMessage = errorDetail.message;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const body = (await response.json()) as ApiResponse<Pedido>;
  return body.data;
}

export async function createPurchaseBatchFromRecetas(
  payload: CreatePedidoFromRecetasPayload
): Promise<PurchaseBatch> {
  const response = await baseFetch('/purchase-batches/from-recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Error al crear lote desde recetas: ${response.status}`;
    try {
      const errorDetail = (await response.json()) as { message?: string };
      if (errorDetail?.message) errorMessage = errorDetail.message;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const body = (await response.json()) as ApiResponse<PurchaseBatch>;
  return body.data;
}

export async function fetchPurchaseBatches(): Promise<PurchaseBatch[]> {
  const response = await baseFetch('/purchase-batches');
  if (!response.ok) {
    throw new Error(`Error al obtener lotes: ${response.status}`);
  }
  const body = (await response.json()) as ApiResponse<PurchaseBatch[]>;
  return body.data;
}

export async function fetchPurchaseBatchById(
  id: string
): Promise<PurchaseBatch> {
  const response = await baseFetch(`/purchase-batches/${id}`);
  if (!response.ok) {
    throw new Error(`Error al obtener el detalle del lote: ${response.status}`);
  }
  const body = (await response.json()) as ApiResponse<PurchaseBatch>;
  return body.data;
}

function getPedidoPdfPath(id: string): string {
  const params = new URLSearchParams({
    tipo: 'pedido',
    pedidoId: id,
  });

  return `/recepciones/reporte-pdf?${params.toString()}`;
}

export async function downloadPedidoPdf(id: string): Promise<void> {
  await downloadFile(getPedidoPdfPath(id), `pedido-${id.slice(0, 8)}.pdf`);
}

export async function printPedidoPdf(id: string): Promise<void> {
  await printPdfFile(getPedidoPdfPath(id));
}
