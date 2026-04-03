import { baseFetch, ApiResponse, unwrapList } from './api.service';
import type {
  AlertaStock,
  CreateAjusteManualInventarioPayload,
  InventarioItem,
  InventarioPorProducto,
} from './inventario.types';

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

export async function fetchInventario(): Promise<InventarioItem[]> {
  const response = await baseFetch('/inventario');
  if (!response.ok) {
    throw new Error(
      `Error al obtener inventario: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<unknown>;
  return unwrapList<InventarioItem>(body.data);
}

/**
 * Agrupa los registros de inventario por producto, sumando cantidades.
 * Un producto aparece una sola vez con el stock total de todos sus lotes y proveedores.
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

export interface CreateInventarioPayload {
  productoProveedorId: string;
  cantidadActual: number;
  cantidadMinima: number;
  cantidadMaxima?: number;
  ubicacionId: string;
  fechaCaducidad?: string;
}

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
