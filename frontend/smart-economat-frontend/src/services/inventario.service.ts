import { baseFetch, ApiResponse } from './api.service';
import type { InventarioItem, InventarioPorProducto } from './inventario.types';

export async function fetchInventario(): Promise<InventarioItem[]> {
  const response = await baseFetch('/inventario');
  if (!response.ok) {
    throw new Error(
      `Error al obtener inventario: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<InventarioItem[]>;
  return body.data ?? [];
}

/**
 * Agrupa los registros de inventario por producto, sumando cantidades.
 * Un producto aparece una sola vez con el stock total de todos sus lotes y proveedores.
 */
export function agregarInventarioPorProducto(
  items: InventarioItem[]
): InventarioPorProducto[] {
  const map = new Map<string, InventarioPorProducto>();

  for (const item of items) {
    const pp = item.productoProveedor;
    if (!pp?.producto) continue;

    const productoId = pp.producto.id;
    const nombre = pp.producto.nombre ?? '';
    const unidad = pp.producto.unidad;
    const tipo = pp.producto.tipo;
    const cantidadActual = Number(item.cantidadActual) || 0;
    const cantidadMinima = Number(item.cantidadMinima) || 0;
    const proveedorNombre = pp.proveedor?.nombre;
    const ubicacion = item.ubicacion?.nombre;

    const existing = map.get(productoId);
    if (existing) {
      existing.cantidadTotal += cantidadActual;
      existing.cantidadMinima += cantidadMinima;
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
        tipo,
        cantidadTotal: cantidadActual,
        cantidadMinima,
        bajoStock: cantidadActual < cantidadMinima,
        proveedores: proveedorNombre ? [proveedorNombre] : [],
        ubicaciones: ubicacion ? [ubicacion] : [],
      });
    }
  }

  const result = Array.from(map.values());
  result.forEach((r) => {
    r.bajoStock = r.cantidadTotal < r.cantidadMinima;
  });
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
      errorBody.message || `Error al actualizar el inventario: ${response.status}`
    );
  }

  const body = (await response.json()) as ApiResponse<InventarioItem>;
  return body.data;
}
