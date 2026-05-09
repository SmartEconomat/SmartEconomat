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
import { normalizeLimitParam, normalizePageParam } from './api.utils';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Contrato de tipos público (PedidoLinePayload). Contexto: smart-economat-frontend (SPA). */
export interface PedidoLinePayload {
  id?: string;
  productoProveedorId: string;
  cantidad: number;
}

/** Contrato de tipos público (CreatePedidoPayload). Contexto: smart-economat-frontend (SPA). */
export interface CreatePedidoPayload {
  proveedorId: string;
  observaciones?: string;
  lineas: PedidoLinePayload[];
}

/** Contrato de tipos público (CreatePurchaseBatchPayload). Contexto: smart-economat-frontend (SPA). */
export interface CreatePurchaseBatchPayload {
  observaciones?: string;
  lineas: PedidoLinePayload[];
}

/** Contrato de tipos público (CreateMissingStockBatchPayload). Contexto: smart-economat-frontend (SPA). */
export interface CreateMissingStockBatchPayload {
  observaciones?: string;
  items: Array<{
    recetaId: string;
    cantidadAProducir: number;
  }>;
}

/** Contrato de tipos público (CreatePedidoFromRecetasPayload). Contexto: smart-economat-frontend (SPA). */
export interface CreatePedidoFromRecetasPayload {
  recetaIds: string[];
  observaciones?: string;
}

/** Contrato de tipos público (ConsolidatePurchaseBatchPayload). Contexto: smart-economat-frontend (SPA). */
export interface ConsolidatePurchaseBatchPayload {
  pedidoUsuarioIds: string[];
  observaciones?: string;
  /** Debe ser true si la UI ya informó y el usuario confirmó la auto-aprobación de pedidos pendientes. */
  autoApprovePending?: boolean;
}

/** Contrato de tipos público (UpdatePurchaseBatchPayload). Contexto: smart-economat-frontend (SPA). */
export interface UpdatePurchaseBatchPayload {
  observaciones?: string;
  lineas: PedidoLinePayload[];
}

/** Contrato de tipos público (UpdatePedidoPayload). Contexto: smart-economat-frontend (SPA). */
export interface UpdatePedidoPayload {
  proveedorId?: string;
  observaciones?: string;
  lineas?: PedidoLinePayload[];
}

/** Contrato de tipos público (CancelPedidoPayload). Contexto: smart-economat-frontend (SPA). */
export interface CancelPedidoPayload {
  motivoCancelacion: string;
}

/** Contrato de tipos público (FetchPedidosOptions). Contexto: smart-economat-frontend (SPA). */
export interface FetchPedidosOptions {
  usuarioId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  sinLote?: boolean;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

/** Contrato de tipos público (FetchPedidoUsuariosOptions). Contexto: smart-economat-frontend (SPA). */
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
 * Mapea un objeto PedidoUsuario a una fila visible para tablas de la UI,
 * calculando resúmenes de proveedores y aplanando líneas de producto.
 */
/**
 * Expone "mapPedidoUsuarioToVisibleRow" en smart-economat-frontend (SPA).
 * @undefined {PedidoUsuario} pedidoUsuario - Entrada efectiva esperada por el contrato.
 * @undefined {PedidoUsuarioRow} Datos efectivos después de ejecutar la operación.
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
 * Obtiene una lista paginada de pedidos directos a proveedores.
 */
/**
 * Expone "fetchPedidos" en smart-economat-frontend (SPA).
 * @undefined {number} page - Entrada efectiva esperada por el contrato.
 * @undefined {number} limit - Entrada efectiva esperada por el contrato.
 * @undefined {string} searchTerm - Entrada efectiva esperada por el contrato.
 * @undefined {string} estado - Entrada efectiva esperada por el contrato.
 * @undefined {FetchPedidosOptions} options - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PaginatedData<Pedido>>} Datos efectivos después de ejecutar la operación.
 */
export async function fetchPedidos(
  page: number = 1,
  limit: number = 10,
  searchTerm: string = '',
  estado: string = '',
  options: FetchPedidosOptions = {}
): Promise<PaginatedData<Pedido>> {
  const params = new URLSearchParams({
    page: normalizePageParam(page).toString(),
    limit: normalizeLimitParam(limit).toString(),
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
 * Obtiene una lista paginada de solicitudes de pedido realizadas por usuarios/alumnos.
 */
/**
 * Expone "fetchPedidoUsuarios" en smart-economat-frontend (SPA).
 * @undefined {number} page - Entrada efectiva esperada por el contrato.
 * @undefined {number} limit - Entrada efectiva esperada por el contrato.
 * @undefined {string} searchTerm - Entrada efectiva esperada por el contrato.
 * @undefined {string} estado - Entrada efectiva esperada por el contrato.
 * @undefined {FetchPedidoUsuariosOptions} options - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PaginatedData<PedidoUsuario>>} Datos efectivos después de ejecutar la operación.
 */
export async function fetchPedidoUsuarios(
  page: number = 1,
  limit: number = 10,
  searchTerm: string = '',
  estado: string = '',
  options: FetchPedidoUsuariosOptions = {}
): Promise<PaginatedData<PedidoUsuario>> {
  const buildParams = (safeMode = false): URLSearchParams => {
    const params = new URLSearchParams({
      page: normalizePageParam(page).toString(),
      limit: normalizeLimitParam(limit).toString(),
    });

    if (searchTerm.trim()) params.set('searchTerm', searchTerm.trim());
    if (!safeMode && estado.trim()) params.set('estado', estado.trim());
    if (options.usuarioId?.trim())
      params.set('usuarioId', options.usuarioId.trim());
    if (options.fechaDesde?.trim())
      params.set('fechaDesde', options.fechaDesde.trim());
    if (options.fechaHasta?.trim())
      params.set('fechaHasta', options.fechaHasta.trim());
    if (!safeMode && options.sortBy?.trim())
      params.set('sortBy', options.sortBy.trim());
    if (!safeMode && options.order) params.set('order', options.order);

    return params;
  };

  let response = await baseFetch(
    `/pedido-usuarios?${buildParams(false).toString()}`
  );

  // Fallback defensivo: algunos despliegues rechazan filtros/opciones concretas con 400.
  if (response.status === 400) {
    response = await baseFetch(
      `/pedido-usuarios?${buildParams(true).toString()}`
    );
  }

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
 * Crea un pedido directo a un proveedor.
 */
/**
 * Crea recursos nuevos en base a las reglas de negocio.
 * @undefined {CreatePedidoPayload} pedido - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Pedido>} Datos efectivos después de ejecutar la operación.
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
 * Actualiza los datos o líneas de un pedido existente.
 */
/**
 * Persiste modificaciones válidas sobre entidades existentes.
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {UpdatePedidoPayload} pedido - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Pedido>} Datos efectivos después de ejecutar la operación.
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
 * Cancela un pedido proporcionando un motivo obligatorio.
 */
/**
 * Expone "cancelPedido" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {CancelPedidoPayload} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Pedido>} Datos efectivos después de ejecutar la operación.
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
 * Marca un pedido como aceptado (confirmación de envío por parte del proveedor).
 */
/**
 * Expone "aceptarPedido" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Pedido>} Datos efectivos después de ejecutar la operación.
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
 * Crea un nuevo lote de compra (Purchase Batch) agrupando múltiples necesidades.
 */
/**
 * Crea recursos nuevos en base a las reglas de negocio.
 * @undefined {CreatePurchaseBatchPayload} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PurchaseBatch>} Datos efectivos después de ejecutar la operación.
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
 * Genera automáticamente un pedido de usuario basado en los productos bajo stock mínimo.
 */
/**
 * Crea recursos nuevos en base a las reglas de negocio.
 * @undefined {CreateMissingStockBatchPayload} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PedidoUsuario>} Datos efectivos después de ejecutar la operación.
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
 * Crea una nueva solicitud de pedido de usuario.
 */
/**
 * Crea recursos nuevos en base a las reglas de negocio.
 * @undefined {CreatePurchaseBatchPayload} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PedidoUsuario>} Datos efectivos después de ejecutar la operación.
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
 * Genera un pedido a proveedor calculando ingredientes necesarios desde una lista de recetas.
 */
/**
 * Crea recursos nuevos en base a las reglas de negocio.
 * @undefined {CreatePedidoFromRecetasPayload} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Pedido>} Datos efectivos después de ejecutar la operación.
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
 * Genera una solicitud de usuario calculando ingredientes necesarios desde recetas.
 */
/**
 * Crea recursos nuevos en base a las reglas de negocio.
 * @undefined {CreatePedidoFromRecetasPayload} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PedidoUsuario>} Datos efectivos después de ejecutar la operación.
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
 * Consolida múltiples solicitudes de usuario en un único lote de compra oficial.
 */
/**
 * Expone "consolidatePurchaseBatch" en smart-economat-frontend (SPA).
 * @undefined {ConsolidatePurchaseBatchPayload} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PurchaseBatch>} Datos efectivos después de ejecutar la operación.
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
 * Recupera todos los lotes de compra activos.
 */
/**
 * Expone "fetchPurchaseBatches" en smart-economat-frontend (SPA).
 * @undefined {Promise<PurchaseBatch[]>} Datos efectivos después de ejecutar la operación.
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
 * Obtiene el detalle completo de una solicitud de pedido de usuario.
 */
/**
 * Expone "fetchPedidoUsuarioById" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PedidoUsuario>} Datos efectivos después de ejecutar la operación.
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
 * Obtiene el detalle completo de un lote de compra.
 */
/**
 * Expone "fetchPurchaseBatchById" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PurchaseBatch>} Datos efectivos después de ejecutar la operación.
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
 * Actualiza la información de un lote de compra.
 */
/**
 * Persiste modificaciones válidas sobre entidades existentes.
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {UpdatePurchaseBatchPayload} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PurchaseBatch>} Datos efectivos después de ejecutar la operación.
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
 * Actualiza una solicitud de pedido de usuario.
 */
/**
 * Persiste modificaciones válidas sobre entidades existentes.
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {UpdatePurchaseBatchPayload} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PedidoUsuario>} Datos efectivos después de ejecutar la operación.
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
 * Aprueba un lote de compra para su procesamiento final.
 */
/**
 * Expone "aceptarPurchaseBatch" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PurchaseBatch>} Datos efectivos después de ejecutar la operación.
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
 * Aprueba una solicitud de pedido de usuario.
 */
/**
 * Expone "aceptarPedidoUsuario" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PedidoUsuario>} Datos efectivos después de ejecutar la operación.
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
 * Cancela un lote de compra.
 */
/**
 * Expone "cancelPurchaseBatch" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {CancelPedidoPayload} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PurchaseBatch>} Datos efectivos después de ejecutar la operación.
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
 * Cancela una solicitud de pedido de usuario.
 */
/**
 * Expone "cancelPedidoUsuario" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {CancelPedidoPayload} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PedidoUsuario>} Datos efectivos después de ejecutar la operación.
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
 * Descarga el PDF oficial de un pedido a proveedor.
 */
/**
 * Expone "downloadPedidoPdf" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function downloadPedidoPdf(id: string): Promise<void> {
  await downloadFile(getPedidoPdfPath(id), `pedido-${id.slice(0, 8)}.pdf`);
}

function getPurchaseBatchPdfPath(id: string): string {
  return `/purchase-batches/${id}/pdf`;
}

/**
 * Descarga el PDF resumen de un lote de compra.
 */
/**
 * Expone "downloadPurchaseBatchPdf" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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
 * Descarga el PDF de una solicitud de pedido de usuario.
 */
/**
 * Expone "downloadPedidoUsuarioPdf" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function downloadPedidoUsuarioPdf(id: string): Promise<void> {
  await downloadFile(
    getPedidoUsuarioPdfPath(id),
    `pedido-${id.slice(0, 8)}.pdf`
  );
}

/**
 * Imprime directamente el PDF de una solicitud de pedido de usuario.
 */
/**
 * Expone "printPedidoUsuarioPdf" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function printPedidoUsuarioPdf(id: string): Promise<void> {
  await printPdfFile(getPedidoUsuarioPdfPath(id));
}

/**
 * Imprime directamente el PDF de un lote de compra.
 */
/**
 * Expone "printPurchaseBatchPdf" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function printPurchaseBatchPdf(id: string): Promise<void> {
  await printPdfFile(getPurchaseBatchPdfPath(id));
}

/**
 * Imprime directamente el PDF de un pedido a proveedor.
 */
/**
 * Expone "printPedidoPdf" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function printPedidoPdf(id: string): Promise<void> {
  await printPdfFile(getPedidoPdfPath(id));
}
