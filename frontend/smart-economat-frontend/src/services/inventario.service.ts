import { baseFetch, ApiResponse, unwrapList } from './api.service';
import type {
  AlertaStock,
  CreateAjusteManualInventarioPayload,
  InventarioItem,
  InventarioPorProducto,
} from './inventario.types';

/**
 * Returns `true` when an inventory item has been soft-deleted (supports both
 * camelCase and snake_case field names returned by different API versions).
 *
 * @param {InventarioItem} item - The inventory item to check.
 * @returns {boolean} Whether the item has been deleted.
 */
function isInventarioItemDeleted(item: InventarioItem): boolean {
  const withSnakeCase = item as InventarioItem & {
    deleted_at?: string | null;
  };

  return Boolean(item.deletedAt || withSnakeCase.deleted_at);
}

/**
 * Fetches all current low-stock alerts from the dedicated alerts endpoint.
 *
 * @returns {Promise<AlertaStock[]>} List of stock alerts.
 * @throws {Error} If the API returns a non-OK response.
 * @example
 * const alerts = await fetchAlertasStock();
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
 * Fetches all active (non-deleted) inventory lot records.
 *
 * @returns {Promise<InventarioItem[]>} List of inventory items.
 * @throws {Error} If the API returns a non-OK response.
 * @example
 * const items = await fetchInventario();
 */
export async function fetchInventario(): Promise<InventarioItem[]> {
  const response = await baseFetch('/inventario');
  if (!response.ok) {
    throw new Error(
      `Error al obtener inventario: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<unknown>;
  return unwrapList<InventarioItem>(body.data).filter(
    (item) => !isInventarioItemDeleted(item)
  );
}

/**
 * Agrupa los registros de inventario por producto, sumando cantidades.
 * Un producto aparece una sola vez con el stock total de todos sus lotes y proveedores.
 *
 * @param {InventarioItem[]} items - Raw inventory lot records to aggregate.
 * @returns {InventarioPorProducto[]} Aggregated list sorted alphabetically by product name.
 * @example
 * const items = await fetchInventario();
 * const aggregated = agregarInventarioPorProducto(items);
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

    const cantidadActual =
      Number(raw.cantidadActual ?? raw.cantidad_actual) || 0;
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
    (row) => row.cantidadTotal > 0 || row.bajoStock
  );
  return result.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/**
 * Payload for creating a new inventory lot record.
 */
export interface CreateInventarioPayload {
  /** Identifier of the product-supplier relation. */
  productoProveedorId: string;
  /** Initial quantity in stock. */
  cantidadActual: number;
  /** Minimum stock threshold. */
  cantidadMinima: number;
  /** Optional maximum stock limit. */
  cantidadMaxima?: number;
  /** Storage location identifier. */
  ubicacionId: string;
  /** Optional expiry date in ISO format (YYYY-MM-DD). */
  fechaCaducidad?: string;
}

/**
 * Creates a new inventory lot record.
 *
 * @param {CreateInventarioPayload} payload - Data for the new lot.
 * @returns {Promise<InventarioItem>} The created inventory item.
 * @throws {Error} If the API returns an error response.
 * @example
 * const item = await createInventarioItem({ productoProveedorId: 'abc', cantidadActual: 10, cantidadMinima: 2, ubicacionId: 'xyz' });
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
  return body.data;
}

/**
 * Partially updates an existing inventory lot record.
 *
 * @param {string} id - The inventory item UUID to update.
 * @param {Partial<CreateInventarioPayload>} payload - Fields to update.
 * @returns {Promise<InventarioItem>} The updated inventory item.
 * @throws {Error} If the API returns an error response.
 * @example
 * const updated = await updateInventarioItem('abc-123', { cantidadMinima: 5 });
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
  return body.data;
}

/**
 * Registers a manual stock adjustment (entry or exit) for a specific inventory lot.
 *
 * @param {CreateAjusteManualInventarioPayload} payload - Adjustment details.
 * @returns {Promise<InventarioItem>} The updated inventory item after the adjustment.
 * @throws {Error} If the API returns an error response.
 * @example
 * const item = await createAjusteManualInventario({ inventarioId: 'abc', tipo: 'salida_ajuste', ajuste: 3, motivo: 'Merma' });
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
  return body.data;
}
