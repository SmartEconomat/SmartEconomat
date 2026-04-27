import { baseFetch, ApiResponse, unwrapList } from './api.service';
import type {
  AlertaStock,
  CreateAjusteManualInventarioPayload,
  InventarioItem,
  InventarioPorProducto,
} from './inventario.types';

/**
 * Documentación en español.
 */
function isInventarioItemDeleted(item: InventarioItem): boolean {
  const withSnakeCase = item as InventarioItem & {
    deleted_at?: string | null;
  };

  return Boolean(item.deletedAt || withSnakeCase.deleted_at);
}

/**
 * Documentación en español.
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
 * Documentación en español.
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
 * Documentación en español.
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
 * Documentación en español.
 */
export interface CreateInventarioPayload {
  /**
   * Documentación en español.
   */
  productoProveedorId: string;
  /**
   * Documentación en español.
   */
  cantidadActual: number;
  /**
   * Documentación en español.
   */
  cantidadMinima: number;
  /**
   * Documentación en español.
   */
  cantidadMaxima?: number;
  /**
   * Documentación en español.
   */
  ubicacionId: string;
  /**
   * Documentación en español.
   */
  fechaCaducidad?: string;
}

/**
 * Documentación en español.
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
 * Documentación en español.
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
 * Documentación en español.
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
