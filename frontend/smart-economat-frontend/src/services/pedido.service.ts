import {
  Pedido,
  PedidoUsuario,
  PedidoUsuarioRow,
  PurchaseBatch,
} from './pedido.types';
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
  id?: string;
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
  ubicacionEntregaSugeridaId?: string;
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

export interface ConsolidatePurchaseBatchPayload {
  pedidoUsuarioIds: string[];
  observaciones?: string;
  ubicacionEntregaSugeridaId?: string;
}

export interface UpdatePurchaseBatchPayload {
  observaciones?: string;
  lineas: PedidoLinePayload[];
}

export interface UpdatePedidoPayload {
  proveedorId?: string;
  observaciones?: string;
  lineas?: PedidoLinePayload[];
}

export interface CancelPedidoPayload {
  motivoCancelacion: string;
}

export interface FetchPedidosOptions {
  usuarioId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  sinLote?: boolean;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

export interface FetchPedidoUsuariosOptions {
  usuarioId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

const buildProviderSummary = (pedidoUsuario: PedidoUsuario): string => {
  const providerNames = Array.from(
    new Set(
      (pedidoUsuario.pedidos || [])
        .map((pedido) => pedido.proveedor?.nombre)
        .filter(Boolean)
    )
  ) as string[];

  if (providerNames.length === 0) return '—';
  if (providerNames.length <= 2) return providerNames.join(', ');
  return `${providerNames.length} proveedores`;
};

export const mapPedidoUsuarioToVisibleRow = (
  pedidoUsuario: PedidoUsuario
): PedidoUsuarioRow => ({
  ...pedidoUsuario,
  entityType: 'pedido_usuario',
  pedidoUsuarioId: pedidoUsuario.id,
  proveedor: {
    id: pedidoUsuario.id,
    nombre: buildProviderSummary(pedidoUsuario),
  },
  pedidoProductos:
    pedidoUsuario.pedidos?.flatMap((pedido) => pedido.pedidoProductos || []) ||
    [],
});

export async function fetchPedidos(
  page: number = 1,
  limit: number = 10,
  searchTerm: string = '',
  estado: string = '',
  options: FetchPedidosOptions = {}
): Promise<PaginatedData<Pedido>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (searchTerm.trim()) params.set('searchTerm', searchTerm.trim());
  if (estado.trim()) params.set('estado', estado.trim());
  if (options.usuarioId?.trim())
    params.set('usuarioId', options.usuarioId.trim());
  if (options.fechaDesde?.trim())
    params.set('fechaDesde', options.fechaDesde.trim());
  if (options.fechaHasta?.trim())
    params.set('fechaHasta', options.fechaHasta.trim());
  if (options.sinLote) params.set('sinLote', 'true');
  if (options.sortBy?.trim()) params.set('sortBy', options.sortBy.trim());
  if (options.order) params.set('order', options.order);

  const response = await baseFetch(`/pedidos?${params.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Error al obtener pedidos: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<PaginatedData<Pedido>>;
  return body.data;
}

export async function fetchPedidoUsuarios(
  page: number = 1,
  limit: number = 10,
  searchTerm: string = '',
  estado: string = '',
  options: FetchPedidoUsuariosOptions = {}
): Promise<PaginatedData<PedidoUsuario>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (searchTerm.trim()) params.set('searchTerm', searchTerm.trim());
  if (estado.trim()) params.set('estado', estado.trim());
  if (options.usuarioId?.trim())
    params.set('usuarioId', options.usuarioId.trim());
  if (options.fechaDesde?.trim())
    params.set('fechaDesde', options.fechaDesde.trim());
  if (options.fechaHasta?.trim())
    params.set('fechaHasta', options.fechaHasta.trim());
  if (options.sortBy?.trim()) params.set('sortBy', options.sortBy.trim());
  if (options.order) params.set('order', options.order);

  const response = await baseFetch(`/pedido-usuarios?${params.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Error al obtener pedidos de usuario: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<
    PaginatedData<PedidoUsuario>
  >;
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

export async function createPedidoUsuarioFromMissingStock(
  payload: CreateMissingStockBatchPayload
): Promise<PedidoUsuario> {
  const response = await baseFetch('/pedido-usuarios/from-missing-stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Error al crear pedido por faltantes: ${response.status}`;
    try {
      const errorDetail = (await response.json()) as { message?: string };
      if (errorDetail?.message) errorMessage = errorDetail.message;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const body = (await response.json()) as ApiResponse<PedidoUsuario>;
  return body.data;
}

export async function createPedidoUsuario(
  payload: CreatePurchaseBatchPayload
): Promise<PedidoUsuario> {
  const response = await baseFetch('/pedido-usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Error al crear pedido de usuario: ${response.status}`;
    try {
      const errorDetail = (await response.json()) as { message?: string };
      if (errorDetail?.message) errorMessage = errorDetail.message;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const body = (await response.json()) as ApiResponse<PedidoUsuario>;
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

export async function createPedidoUsuarioFromRecetas(
  payload: CreatePedidoFromRecetasPayload
): Promise<PedidoUsuario> {
  const response = await baseFetch('/pedido-usuarios/from-recipes', {
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

  const body = (await response.json()) as ApiResponse<PedidoUsuario>;
  return body.data;
}

export async function consolidatePurchaseBatch(
  payload: ConsolidatePurchaseBatchPayload
): Promise<PurchaseBatch> {
  const response = await baseFetch('/purchase-batches/consolidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Error al consolidar lote de compra: ${response.status}`;
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

export async function fetchPedidoUsuarioById(
  id: string
): Promise<PedidoUsuario> {
  const response = await baseFetch(`/pedido-usuarios/${id}`);
  if (!response.ok) {
    throw new Error(
      `Error al obtener el detalle del pedido de usuario: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<PedidoUsuario>;
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

export async function updatePurchaseBatch(
  id: string,
  payload: UpdatePurchaseBatchPayload
): Promise<PurchaseBatch> {
  const response = await baseFetch(`/purchase-batches/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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

  const body = (await response.json()) as ApiResponse<PurchaseBatch>;
  return body.data;
}

export async function updatePedidoUsuario(
  id: string,
  payload: UpdatePurchaseBatchPayload
): Promise<PedidoUsuario> {
  const response = await baseFetch(`/pedido-usuarios/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Error al actualizar pedido de usuario: ${response.status}`;
    try {
      const errorDetail = (await response.json()) as { message?: string };
      if (errorDetail?.message) errorMessage = errorDetail.message;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const body = (await response.json()) as ApiResponse<PedidoUsuario>;
  return body.data;
}

export async function aceptarPurchaseBatch(id: string): Promise<PurchaseBatch> {
  const response = await baseFetch(`/purchase-batches/${id}/aceptar`, {
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
      errorDetail?.message || `Error al aprobar pedido: ${response.status}`
    );
  }

  const body = (await response.json()) as ApiResponse<PurchaseBatch>;
  return body.data;
}

export async function aceptarPedidoUsuario(id: string): Promise<PedidoUsuario> {
  const response = await baseFetch(`/pedido-usuarios/${id}/aceptar`, {
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
      errorDetail?.message ||
        `Error al aprobar pedido de usuario: ${response.status}`
    );
  }

  const body = (await response.json()) as ApiResponse<PedidoUsuario>;
  return body.data;
}

export async function tramitarPurchaseBatch(
  id: string
): Promise<PurchaseBatch> {
  const response = await baseFetch(`/purchase-batches/${id}/tramitar`, {
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
      errorDetail?.message || `Error al tramitar pedido: ${response.status}`
    );
  }

  const body = (await response.json()) as ApiResponse<PurchaseBatch>;
  return body.data;
}

export async function cancelPurchaseBatch(
  id: string,
  payload: CancelPedidoPayload
): Promise<PurchaseBatch> {
  const response = await baseFetch(`/purchase-batches/${id}/cancelar`, {
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

  const body = (await response.json()) as ApiResponse<PurchaseBatch>;
  return body.data;
}

export async function cancelPedidoUsuario(
  id: string,
  payload: CancelPedidoPayload
): Promise<PedidoUsuario> {
  const response = await baseFetch(`/pedido-usuarios/${id}/cancelar`, {
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
      errorDetail?.message ||
        `Error al cancelar pedido de usuario: ${response.status}`
    );
  }

  const body = (await response.json()) as ApiResponse<PedidoUsuario>;
  return body.data;
}

export async function restaurarPedido(id: string): Promise<Pedido> {
  const response = await baseFetch(`/pedidos/${id}/restaurar`, {
    method: 'PATCH',
  });

  if (!response.ok) {
    throw new Error(`Error al restaurar pedido: ${response.status}`);
  }

  const body = (await response.json()) as ApiResponse<Pedido>;
  return body.data;
}

export async function restaurarPedidoUsuario(
  id: string
): Promise<PedidoUsuario> {
  const response = await baseFetch(`/pedido-usuarios/${id}/restaurar`, {
    method: 'PATCH',
  });

  if (!response.ok) {
    throw new Error(`Error al restaurar pedido de usuario: ${response.status}`);
  }

  const body = (await response.json()) as ApiResponse<PedidoUsuario>;
  return body.data;
}

export async function deletePedidoUsuario(id: string): Promise<void> {
  const response = await baseFetch(`/pedido-usuarios/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    let errorMessage = `Error al eliminar pedido de usuario: ${response.status}`;
    try {
      const errorDetail = (await response.json()) as { message?: string };
      if (errorDetail?.message) errorMessage = errorDetail.message;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }
}

export async function restaurarPurchaseBatch(
  id: string
): Promise<PurchaseBatch> {
  const response = await baseFetch(`/purchase-batches/${id}/restaurar`, {
    method: 'PATCH',
  });

  if (!response.ok) {
    throw new Error(`Error al restaurar lote: ${response.status}`);
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

function getPurchaseBatchPdfPath(id: string): string {
  return `/purchase-batches/${id}/pdf`;
}

export async function downloadPurchaseBatchPdf(id: string): Promise<void> {
  await downloadFile(
    getPurchaseBatchPdfPath(id),
    `reporte-lote-${id.slice(0, 8)}.pdf`
  );
}

function getPedidoUsuarioPdfPath(id: string): string {
  return `/pedido-usuarios/${id}/pdf`;
}

export async function downloadPedidoUsuarioPdf(id: string): Promise<void> {
  await downloadFile(
    getPedidoUsuarioPdfPath(id),
    `pedido-${id.slice(0, 8)}.pdf`
  );
}

export async function printPedidoUsuarioPdf(id: string): Promise<void> {
  await printPdfFile(getPedidoUsuarioPdfPath(id));
}

export async function printPurchaseBatchPdf(id: string): Promise<void> {
  await printPdfFile(getPurchaseBatchPdfPath(id));
}

export async function printPedidoPdf(id: string): Promise<void> {
  await printPdfFile(getPedidoPdfPath(id));
}
