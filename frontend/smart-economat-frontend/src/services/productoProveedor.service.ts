import { baseFetch } from './api.service';

/** Contrato de tipos público (ProductoProveedorOption). Contexto: smart-economat-frontend (SPA). */
export interface ProductoProveedorOption {
  id: string;
  productoNombre: string;
  productoId?: string;
  unidad?: string;
  contenido?: number;
  proveedorNombre: string;
  proveedorId?: string;
  marca?: string;
  codigoBarras?: string;
  precioUnitario?: number;
  label: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Busca relaciones producto-proveedor por término de búsqueda.
 * Utilizado en autocompletados de la UI.
 */
/**
 * Expone "searchProductoProveedor" en smart-economat-frontend (SPA).
 * @undefined {string} q - Entrada efectiva esperada por el contrato.
 * @undefined {number} limit - Entrada efectiva esperada por el contrato.
 * @undefined {number} offset - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<ProductoProveedorOption[]>} Datos efectivos después de ejecutar la operación.
 */
const MAX_PRODUCTO_PROVEEDOR_SEARCH_LIMIT = 50;

export async function searchProductoProveedor(
  q: string,
  limit: number = 20,
  offset: number = 0
): Promise<ProductoProveedorOption[]> {
  const safeLimit = Math.min(
    Math.max(1, Math.floor(Number(limit) || 20)),
    MAX_PRODUCTO_PROVEEDOR_SEARCH_LIMIT
  );
  const safeOffset = Math.max(0, Math.floor(Number(offset) || 0));

  const params = new URLSearchParams();
  if (q.trim()) params.set('q', q.trim());
  params.set('limit', String(safeLimit));
  params.set('offset', String(safeOffset));

  const response = await baseFetch(
    `/producto-proveedor/search?${params.toString()}`
  );
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message ||
        `Error al buscar producto/proveedor: ${response.status}`
    );
  }

  const body = (await response.json()) as ApiResponse<
    Array<{
      id: string;
      productoNombre: string;
      productoId?: string;
      unidad?: string;
      contenido?: number;
      proveedorNombre: string;
      proveedorId?: string;
      marca?: string;
      codigoBarras?: string;
      precioUnitario?: number;
    }>
  >;

  const rows = body.data ?? [];
  return rows.map((r) => ({
    ...r,
    label: `${r.productoNombre} (${r.proveedorNombre})${r.marca ? ` - ${r.marca}` : ''}`,
  }));
}
