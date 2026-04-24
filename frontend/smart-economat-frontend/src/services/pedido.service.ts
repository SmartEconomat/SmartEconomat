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

const formatBatchReferenceFromNumber = (
  numero?: string | number
): string | undefined => {
  if (numero === undefined || numero === null) {
    return undefined;
  }

  const numeroTexto = String(numero).trim();
  if (!numeroTexto) {
    return undefined;
  }

  return `LC-${numeroTexto.padStart(6, '0')}`;
};

const normalizePedido = (pedido: Pedido): Pedido => {
  const numeroPedidoProveedor =
    pedido.numeroPedidoProveedor || pedido.numeroGlobal;
  const numeroPedidoVisible =
    pedido.numeroPedidoVisible || pedido.pedidoUsuario?.numeroGlobal;
  const referenciaPedidoVisible =
    pedido.referenciaPedidoVisible ||
    (numeroPedidoVisible ? `PU-${String(numeroPedidoVisible)}` : undefined);

  return {
    ...pedido,
    numeroPedidoProveedor: numeroPedidoProveedor
      ? String(numeroPedidoProveedor)
      : undefined,
    numeroPedidoVisible: numeroPedidoVisible
      ? String(numeroPedidoVisible)
      : undefined,
    referenciaPedidoVisible,
  };
};

const normalizePurchaseBatch = (batch: PurchaseBatch): PurchaseBatch => {
  const numeroLote = batch.numeroLote || batch.numeroGlobal;

  return {
    ...batch,
    numeroLote: numeroLote ? String(numeroLote) : undefined,
    referenciaLote:
      batch.referenciaLote ||
      batch.referencia ||
      formatBatchReferenceFromNumber(numeroLote),
    pedidos: (batch.pedidos || []).map(normalizePedido),
  };
};

const normalizePedidoUsuario = (
  pedidoUsuario: PedidoUsuario
): PedidoUsuario => ({
  ...pedidoUsuario,
  pedidos: (pedidoUsuario.pedidos || []).map(normalizePedido),
});

/**
 * @description Maps a `PedidoUsuario` entity to a display row shape suitable for table rendering.
 * @param {PedidoUsuario} pedidoUsuario - The source pedido-usuario record.
 * @returns {PedidoUsuarioRow} The normalised row with denormalized provider summary and product lines.
 */
export const mapPedidoUsuarioToVisibleRow = (
  pedidoUsuario: PedidoUsuario
): PedidoUsuarioRow => {
  const normalizedPedidoUsuario = normalizePedidoUsuario(pedidoUsuario);

  return {
    ...normalizedPedidoUsuario,
    entityType: 'pedido_usuario',
    pedidoUsuarioId: normalizedPedidoUsuario.id,
    proveedor: {
      id: normalizedPedidoUsuario.id,
      nombre: buildProviderSummary(normalizedPedidoUsuario),
    },
    pedidoProductos:
      normalizedPedidoUsuario.pedidos?.flatMap(
        (pedido) => pedido.pedidoProductos || []
      ) || [],
  };
};

/**
 * @description Fetches a paginated list of provider-level pedido records.
 * @param {number} [page=1] - The page number to retrieve.
 * @param {number} [limit=10] - Number of records per page.
 * @param {string} [searchTerm=''] - Optional text search filter.
 * @param {string} [estado=''] - Optional status filter.
 * @param {FetchPedidosOptions} [options={}] - Additional filter and sort options.
 * @returns {Promise<PaginatedData<Pedido>>} Paginated pedido records.
 * @throws {Error} When the API returns a non-OK response.
 */
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
  return {
    ...body.data,
    data: body.data.data.map(normalizePedido),
  };
}

/**
 * @description Fetches a paginated list of user-level pedido (PedidoUsuario) records.
 * @param {number} [page=1] - The page number to retrieve.
 * @param {number} [limit=10] - Number of records per page.
 * @param {string} [searchTerm=''] - Optional text search filter.
 * @param {string} [estado=''] - Optional status filter.
 * @param {FetchPedidoUsuariosOptions} [options={}] - Additional filter and sort options.
 * @returns {Promise<PaginatedData<PedidoUsuario>>} Paginated pedido-usuario records.
 * @throws {Error} When the API returns a non-OK response.
 */
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
  return {
    ...body.data,
    data: body.data.data.map(normalizePedidoUsuario),
  };
}

/**
 * @description Creates a new provider-level pedido.
 * @param {CreatePedidoPayload} pedido - Pedido data including supplier, notes, and product lines.
 * @returns {Promise<Pedido>} The created pedido record.
 * @throws {Error} When the API returns an error response.
 */
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
  return normalizePedido(body.data);
}

/**
 * @description Partially updates an existing provider-level pedido.
 * @param {string} id - The pedido UUID to update.
 * @param {UpdatePedidoPayload} pedido - Fields to update.
 * @returns {Promise<Pedido>} The updated pedido record.
 * @throws {Error} When the API returns an error response.
 */
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
  return normalizePedido(body.data);
}

/**
 * @description Cancels a provider-level pedido with a mandatory cancellation reason.
 * @param {string} id - The pedido UUID to cancel.
 * @param {CancelPedidoPayload} payload - Contains the cancellation reason string.
 * @returns {Promise<Pedido>} The updated pedido record.
 * @throws {Error} When the API returns an error response.
 */
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
  return normalizePedido(body.data);
}

/**
 * @description Marks a provider-level pedido as accepted by the manager.
 * @param {string} id - The pedido UUID to accept.
 * @returns {Promise<Pedido>} The updated pedido record.
 * @throws {Error} When the API returns an error response.
 */
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
  return normalizePedido(body.data);
}

/**
 * @description Creates a new purchase batch (lote de compra) with manual product lines.
 * @param {CreatePurchaseBatchPayload} payload - Optional notes and product lines.
 * @returns {Promise<PurchaseBatch>} The created purchase batch.
 * @throws {Error} When the API returns an error response.
 */
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
  return normalizePurchaseBatch(body.data);
}

/**
 * @description Creates a user-level pedido automatically from missing stock items for one or more recipes.
 * @param {CreateMissingStockBatchPayload} payload - Recipe IDs and quantities to cover.
 * @returns {Promise<PedidoUsuario>} The created pedido-usuario record.
 * @throws {Error} When the API returns an error response.
 */
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
  return normalizePedidoUsuario(body.data);
}

/**
 * @description Creates a new user-level pedido with explicit product lines.
 * @param {CreatePurchaseBatchPayload} payload - Optional notes and product lines.
 * @returns {Promise<PedidoUsuario>} The created pedido-usuario record.
 * @throws {Error} When the API returns an error response.
 */
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
  return normalizePedidoUsuario(body.data);
}

/**
 * @description Creates a provider-level pedido automatically from a list of recipe IDs.
 * @param {CreatePedidoFromRecetasPayload} payload - Recipe IDs and optional notes.
 * @returns {Promise<Pedido>} The created pedido.
 * @throws {Error} When the API returns an error response.
 */
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
  return normalizePedido(body.data);
}

/**
 * @description Creates a user-level pedido automatically from a list of recipe IDs.
 * @param {CreatePedidoFromRecetasPayload} payload - Recipe IDs and optional notes.
 * @returns {Promise<PedidoUsuario>} The created pedido-usuario record.
 * @throws {Error} When the API returns an error response.
 */
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
  return normalizePedidoUsuario(body.data);
}

/**
 * @description Consolidates multiple user-level pedidos into a single purchase batch.
 * @param {ConsolidatePurchaseBatchPayload} payload - IDs of the pedido-usuarios and optional notes.
 * @returns {Promise<PurchaseBatch>} The consolidated purchase batch.
 * @throws {Error} When the API returns an error response.
 */
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
  return normalizePurchaseBatch(body.data);
}

/**
 * @description Fetches all purchase batches (lotes de compra).
 * @returns {Promise<PurchaseBatch[]>} List of all purchase batches.
 * @throws {Error} When the API returns a non-OK response.
 */
export async function fetchPurchaseBatches(): Promise<PurchaseBatch[]> {
  const response = await baseFetch('/purchase-batches');
  if (!response.ok) {
    throw new Error(`Error al obtener lotes: ${response.status}`);
  }
  const body = (await response.json()) as ApiResponse<PurchaseBatch[]>;
  return body.data.map(normalizePurchaseBatch);
}

/**
 * @description Fetches the full detail of a user-level pedido by its ID.
 * @param {string} id - The pedido-usuario UUID.
 * @returns {Promise<PedidoUsuario>} The pedido-usuario detail.
 * @throws {Error} When the API returns a non-OK response.
 */
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
  return normalizePedidoUsuario(body.data);
}

/**
 * @description Fetches the full detail of a purchase batch by its ID.
 * @param {string} id - The purchase batch UUID.
 * @returns {Promise<PurchaseBatch>} The purchase batch detail.
 * @throws {Error} When the API returns a non-OK response.
 */
export async function fetchPurchaseBatchById(
  id: string
): Promise<PurchaseBatch> {
  const response = await baseFetch(`/purchase-batches/${id}`);
  if (!response.ok) {
    throw new Error(`Error al obtener el detalle del lote: ${response.status}`);
  }
  const body = (await response.json()) as ApiResponse<PurchaseBatch>;
  return normalizePurchaseBatch(body.data);
}

/**
 * @description Partially updates an existing purchase batch.
 * @param {string} id - The purchase batch UUID to update.
 * @param {UpdatePurchaseBatchPayload} payload - Optional notes and product lines to update.
 * @returns {Promise<PurchaseBatch>} The updated purchase batch.
 * @throws {Error} When the API returns an error response.
 */
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
  return normalizePurchaseBatch(body.data);
}

/**
 * @description Partially updates an existing user-level pedido.
 * @param {string} id - The pedido-usuario UUID to update.
 * @param {UpdatePurchaseBatchPayload} payload - Optional notes and product lines to update.
 * @returns {Promise<PedidoUsuario>} The updated pedido-usuario record.
 * @throws {Error} When the API returns an error response.
 */
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
  return normalizePedidoUsuario(body.data);
}

/**
 * @description Marks a purchase batch as accepted by the manager.
 * @param {string} id - The purchase batch UUID to accept.
 * @returns {Promise<PurchaseBatch>} The updated purchase batch.
 * @throws {Error} When the API returns an error response.
 */
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
  return normalizePurchaseBatch(body.data);
}

/**
 * @description Marks a user-level pedido as accepted by the manager.
 * @param {string} id - The pedido-usuario UUID to accept.
 * @returns {Promise<PedidoUsuario>} The updated pedido-usuario record.
 * @throws {Error} When the API returns an error response.
 */
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
  return normalizePedidoUsuario(body.data);
}

/**
 * @description Cancels a purchase batch with a mandatory cancellation reason.
 * @param {string} id - The purchase batch UUID to cancel.
 * @param {CancelPedidoPayload} payload - Contains the cancellation reason string.
 * @returns {Promise<PurchaseBatch>} The updated purchase batch.
 * @throws {Error} When the API returns an error response.
 */
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
  return normalizePurchaseBatch(body.data);
}

/**
 * @description Cancels a user-level pedido with a mandatory cancellation reason.
 * @param {string} id - The pedido-usuario UUID to cancel.
 * @param {CancelPedidoPayload} payload - Contains the cancellation reason string.
 * @returns {Promise<PedidoUsuario>} The updated pedido-usuario record.
 * @throws {Error} When the API returns an error response.
 */
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
  return normalizePedidoUsuario(body.data);
}

function getPedidoPdfPath(id: string): string {
  const params = new URLSearchParams({
    tipo: 'pedido',
    pedidoId: id,
  });

  return `/recepciones/reporte-pdf?${params.toString()}`;
}

/**
 * @description Downloads the PDF report for a provider-level pedido.
 * @param {string} id - The pedido UUID.
 * @returns {Promise<void>}
 */
export async function downloadPedidoPdf(id: string): Promise<void> {
  await downloadFile(getPedidoPdfPath(id), `pedido-${id.slice(0, 8)}.pdf`);
}

function getPurchaseBatchPdfPath(id: string): string {
  return `/purchase-batches/${id}/pdf`;
}

/**
 * @description Downloads the PDF report for a purchase batch.
 * @param {string} id - The purchase batch UUID.
 * @returns {Promise<void>}
 */
export async function downloadPurchaseBatchPdf(id: string): Promise<void> {
  await downloadFile(
    getPurchaseBatchPdfPath(id),
    `reporte-lote-${id.slice(0, 8)}.pdf`
  );
}

function getPedidoUsuarioPdfPath(id: string): string {
  return `/pedido-usuarios/${id}/pdf`;
}

/**
 * @description Downloads the PDF report for a user-level pedido.
 * @param {string} id - The pedido-usuario UUID.
 * @returns {Promise<void>}
 */
export async function downloadPedidoUsuarioPdf(id: string): Promise<void> {
  await downloadFile(
    getPedidoUsuarioPdfPath(id),
    `pedido-${id.slice(0, 8)}.pdf`
  );
}

/**
 * @description Opens a print dialog for the PDF of a user-level pedido.
 * @param {string} id - The pedido-usuario UUID.
 * @returns {Promise<void>}
 */
export async function printPedidoUsuarioPdf(id: string): Promise<void> {
  await printPdfFile(getPedidoUsuarioPdfPath(id));
}

/**
 * @description Opens a print dialog for the PDF of a purchase batch.
 * @param {string} id - The purchase batch UUID.
 * @returns {Promise<void>}
 */
export async function printPurchaseBatchPdf(id: string): Promise<void> {
  await printPdfFile(getPurchaseBatchPdfPath(id));
}

/**
 * @description Opens a print dialog for the PDF of a provider-level pedido.
 * @param {string} id - The pedido UUID.
 * @returns {Promise<void>}
 */
export async function printPedidoPdf(id: string): Promise<void> {
  await printPdfFile(getPedidoPdfPath(id));
}
