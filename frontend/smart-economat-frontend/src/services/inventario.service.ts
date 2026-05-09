import {
  baseFetch,
  ApiResponse,
  buildQueryParams,
  unwrapList,
  unwrapPaginated,
} from './api.service';
import type {
  AlertaStock,
  CrearTransferenciaInventarioPayload,
  CreateAjusteManualInventarioPayload,
  InventarioItem,
  InventarioPorProducto,
  TransferenciaInventarioEjecutada,
} from './inventario.types';

const INVENTARIO_CACHE_TTL_MS = 30_000;

let inventarioCache: {
  data: InventarioItem[];
  expiresAt: number;
} | null = null;

const inventarioInFlightByKey = new Map<string, Promise<InventarioItem[]>>();

/** Contrato de tipos público (FetchInventarioFilters). Contexto: smart-economat-frontend (SPA). */
export interface FetchInventarioFilters {
  search?: string;
  /** Restringe lotes a estas ubicaciones (UUID). */
  ubicacionIds?: string[];
  onlyLowStock?: boolean;
  forceRefresh?: boolean;
}

const buildInventarioFetchKey = (filters?: FetchInventarioFilters): string =>
  JSON.stringify({
    search: filters?.search?.trim() ?? '',
    ubicacionIds: [...(filters?.ubicacionIds ?? [])].sort().join('|'),
    onlyLowStock: Boolean(filters?.onlyLowStock),
  });

const isInventarioCacheValid = (): boolean =>
  Boolean(inventarioCache && inventarioCache.expiresAt > Date.now());

/**
 * Expone "invalidateInventarioCache" en smart-economat-frontend (SPA).
 * @undefined {void} Datos efectivos después de ejecutar la operación.
 */
export const invalidateInventarioCache = (): void => {
  inventarioCache = null;
};

/**
 * Determina si un ítem de inventario ha sido marcado como eliminado.
 */
function isInventarioItemDeleted(item: InventarioItem): boolean {
  const withSnakeCase = item as InventarioItem & {
    deleted_at?: string | null;
  };

  return Boolean(item.deletedAt || withSnakeCase.deleted_at);
}

/**
 * Recupera la lista de productos que se encuentran bajo el umbral de stock mínimo.
 */
/**
 * Expone "fetchAlertasStock" en smart-economat-frontend (SPA).
 * @undefined {Promise<AlertaStock[]>} Datos efectivos después de ejecutar la operación.
 */
export async function fetchAlertasStock(): Promise<AlertaStock[]> {
  const response = await baseFetch('/alertas/stock');
  if (!response.ok) {
    throw new Error(
      `Error al obtener alertas de stock: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<unknown>;
  return unwrapList<AlertaStock>(body.data);
}

/**
 * Obtiene el estado actual del inventario (todas las páginas necesarias) filtrable por búsqueda, ubicación y stock bajo.
 * Implementa caché reactiva para la vista sin filtros.
 */
/**
 * Expone "fetchInventario" en smart-economat-frontend (SPA).
 * @undefined {FetchInventarioFilters | undefined} filters - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<InventarioItem[]>} Datos efectivos después de ejecutar la operación.
 */
export async function fetchInventario(
  filters?: FetchInventarioFilters
): Promise<InventarioItem[]> {
  const hasServerFilters =
    Boolean(filters?.search?.trim()) ||
    Boolean(filters?.ubicacionIds?.length) ||
    Boolean(filters?.onlyLowStock);

  if (
    filters?.forceRefresh !== true &&
    !hasServerFilters &&
    isInventarioCacheValid() &&
    inventarioCache
  ) {
    return inventarioCache.data;
  }

  const key = buildInventarioFetchKey(filters);
  const inFlight = inventarioInFlightByKey.get(key);
  if (inFlight) {
    return inFlight;
  }

  const run = (async (): Promise<InventarioItem[]> => {
    const merged: InventarioItem[] = [];
    let page = 1;
    let totalPages = 1;
    const limit = 50;
    const MAX_PAGES = 400;

    while (page <= totalPages && page <= MAX_PAGES) {
      const queryParams = buildQueryParams(
        {
          page,
          limit,
          searchTerm: filters?.search?.trim(),
          onlyLowStock: filters?.onlyLowStock ? true : undefined,
          ubicacionIds: filters?.ubicacionIds?.length
            ? filters.ubicacionIds
            : undefined,
        },
        limit,
        limit
      );

      const response = await baseFetch(`/inventario?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(
          `Error al obtener inventario: ${response.status} ${response.statusText}`
        );
      }
      const body = (await response.json()) as ApiResponse<unknown>;
      const paginated = unwrapPaginated<InventarioItem>(body.data);
      const chunk = (
        paginated ? paginated.data : unwrapList<InventarioItem>(body.data)
      ).filter(
        (item) =>
          !isInventarioItemDeleted(item) && Number(item.cantidadActual ?? 0) > 0
      );

      merged.push(...chunk);

      if (paginated && typeof paginated.totalPages === 'number') {
        totalPages = paginated.totalPages;
      } else {
        break;
      }
      page += 1;
    }

    if (!hasServerFilters) {
      inventarioCache = {
        data: merged,
        expiresAt: Date.now() + INVENTARIO_CACHE_TTL_MS,
      };
    }

    return merged;
  })();

  inventarioInFlightByKey.set(key, run);

  try {
    return await run;
  } finally {
    inventarioInFlightByKey.delete(key);
  }
}

/**
 * Agrupa ítems de inventario individuales por producto para visualización en el catálogo.
 * Suma cantidades de diferentes ubicaciones y detecta estados de bajo stock.
 */
/**
 * Expone "agregarInventarioPorProducto" en smart-economat-frontend (SPA).
 * @undefined {InventarioItem[]} items - Entrada efectiva esperada por el contrato.
 * @undefined {InventarioPorProducto[]} Datos efectivos después de ejecutar la operación.
 */
export function agregarInventarioPorProducto(
  items: InventarioItem[]
): InventarioPorProducto[] {
  const map = new Map<string, InventarioPorProducto>();

  type RawItem = InventarioItem & {
    producto?: {
      id: string;
      nombre: string;
      unidad?: string;
      contenido?: number;
      tipo?: string;
      codigoBarras?: string;
    };
    proveedor?: { id: string; nombre: string };
    cantidad_actual?: number;
    cantidad_minima?: number;
    ubicacionNombre?: string;
  };
  for (const item of items) {
    const raw = item as RawItem;
    if (isInventarioItemDeleted(item)) continue;

    const pp = raw.productoProveedor;
    const producto = pp?.producto ?? raw.producto;
    const proveedor = pp?.proveedor ?? raw.proveedor;

    if (!producto || !producto.id) continue;

    const cantidadActual =
      Number(raw.cantidadActual ?? raw.cantidad_actual) || 0;
    if (cantidadActual <= 0) continue;

    const productoId = producto.id;
    const nombre = producto.nombre ?? '';
    const codigoBarras = producto.codigoBarras;
    const unidad = producto.unidad;
    const contenidoPorUnidadRaw = Number(producto.contenido);
    const contenidoPorUnidad =
      Number.isFinite(contenidoPorUnidadRaw) && contenidoPorUnidadRaw > 0
        ? contenidoPorUnidadRaw
        : undefined;
    const tipo = producto.tipo;
    const cantidadMinima =
      Number(raw.cantidadMinima ?? raw.cantidad_minima) || 0;
    const proveedorNombre = proveedor?.nombre;
    const ubicacion = raw.ubicacion?.nombre ?? raw.ubicacionNombre;

    const existing = map.get(productoId);
    if (existing) {
      existing.cantidadTotal += cantidadActual;
      existing.cantidadMinima += cantidadMinima;
      existing.bajoStock =
        existing.bajoStock || cantidadActual < cantidadMinima;
      if (!existing.contenidoPorUnidad && contenidoPorUnidad) {
        existing.contenidoPorUnidad = contenidoPorUnidad;
      }
      if (proveedorNombre && !existing.proveedores.includes(proveedorNombre)) {
        existing.proveedores.push(proveedorNombre);
      }
      if (ubicacion && !existing.ubicaciones?.includes(ubicacion)) {
        existing.ubicaciones = existing.ubicaciones ?? [];
        existing.ubicaciones.push(ubicacion);
      }
    } else {
      map.set(productoId, {
        productoId,
        nombre,
        unidad,
        contenidoPorUnidad,
        tipo,
        cantidadTotal: cantidadActual,
        cantidadMinima,
        bajoStock: cantidadActual < cantidadMinima,
        codigoBarras,
        proveedores: proveedorNombre ? [proveedorNombre] : [],
        ubicaciones: ubicacion ? [ubicacion] : [],
      });
    }
  }

  const result = Array.from(map.values()).filter(
    (row) => row.cantidadTotal > 0
  );
  return result.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/**
 * Payload para la creación de un nuevo registro de stock en inventario.
 */
export interface CreateInventarioPayload {
  /**
  /**
   * ID de la relación producto-proveedor específica.
   */
  productoProveedorId: string;
  /**
  /**
   * Cantidad inicial que entra en stock.
   */
  cantidadActual: number;
  /**
  /**
   * Umbral de seguridad para alertas de reaprovisionamiento.
   */
  cantidadMinima: number;
  /**
  /**
   * Capacidad máxima recomendada para la ubicación.
   */
  cantidadMaxima?: number;
  /**
  /**
   * ID de la ubicación física donde se almacenará.
   */
  ubicacionId: string;
  /**
  /**
   * Fecha opcional de vencimiento del lote.
   */
  fechaCaducidad?: string;
}

/**
 * Crea una nueva entrada de inventario manual.
 */
/**
 * Crea recursos nuevos en base a las reglas de negocio.
 * @undefined {CreateInventarioPayload} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<InventarioItem>} Datos efectivos después de ejecutar la operación.
 */
export async function createInventarioItem(
  payload: CreateInventarioPayload
): Promise<InventarioItem> {
  const response = await baseFetch('/inventario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Error al crear inventario: ${response.status}`
    );
  }

  const body = (await response.json()) as ApiResponse<InventarioItem>;
  invalidateInventarioCache();
  return body.data;
}

/**
 * Actualiza los niveles de stock o parámetros de un ítem de inventario existente.
 */
/**
 * Persiste modificaciones válidas sobre entidades existentes.
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Partial<CreateInventarioPayload>} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<InventarioItem>} Datos efectivos después de ejecutar la operación.
 */
export async function updateInventarioItem(
  id: string,
  payload: Partial<CreateInventarioPayload>
): Promise<InventarioItem> {
  const response = await baseFetch(`/inventario/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message ||
        `Error al actualizar el inventario: ${response.status}`
    );
  }

  const body = (await response.json()) as ApiResponse<InventarioItem>;
  invalidateInventarioCache();
  return body.data;
}

/**
 * Registra un ajuste manual de inventario (corrección de stock, regularización).
 */
/**
 * Crea recursos nuevos en base a las reglas de negocio.
 * @undefined {CreateAjusteManualInventarioPayload} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<InventarioItem>} Datos efectivos después de ejecutar la operación.
 */
export async function createAjusteManualInventario(
  payload: CreateAjusteManualInventarioPayload
): Promise<InventarioItem> {
  const response = await baseFetch('/inventario/ajustes-manuales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message ||
        `Error al registrar el ajuste manual: ${response.status}`
    );
  }

  const body = (await response.json()) as ApiResponse<InventarioItem>;
  invalidateInventarioCache();
  return body.data;
}

/**
 * Traslado formal de saldos entre ubicaciones (autoridad backend, idempotencia opcional).
 */
export async function ejecutarTransferenciaInventario(
  payload: CrearTransferenciaInventarioPayload
): Promise<TransferenciaInventarioEjecutada> {
  const response = await baseFetch('/inventario/transferencias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(
      errorBody.message ||
        `Error al transferir stock: ${response.status} ${response.statusText}`
    );
  }

  const body =
    (await response.json()) as ApiResponse<TransferenciaInventarioEjecutada>;
  invalidateInventarioCache();
  return body.data;
}
