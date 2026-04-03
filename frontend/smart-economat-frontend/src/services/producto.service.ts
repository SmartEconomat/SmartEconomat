import {
  Producto,
  ProductosQueryParams,
  HistorialPrecio,
} from './producto.types';
import { baseFetch, ApiResponse, PaginatedData } from './api.service';

const PRODUCTOS_CACHE_TTL_MS = 1000;
const PRODUCTOS_MAX_LIMIT = 50;
const PRODUCTOS_DEFAULT_LIMIT = 20;

type ProductSortOrder = 'asc' | 'desc' | 'ASC' | 'DESC';

const productosRequestCache = new Map<
  string,
  {
    promise: Promise<PaginatedData<Producto>>;
    expiresAt: number;
  }
>();

export interface ProductoProveedorPayload {
  proveedorId: string;
  marcaEspecifica?: string;
  codigoBarras?: string;
  precioUnitario?: number;
}

export interface ProductoMutationPayload {
  nombre?: string;
  marca?: string;
  descripcion?: string;
  unidad?: string;
  tipo?: string;
  contenido?: number;
  codigoBarras?: string;
  pathImg?: string;
  alergenos?: string[];
  proveedores?: ProductoProveedorPayload[];
}

function normalizePage(page?: number): number | undefined {
  if (page == null || Number.isNaN(page)) return undefined;
  return Math.max(1, Math.trunc(page));
}

function normalizeLimit(limit?: number): number | undefined {
  if (limit == null || Number.isNaN(limit)) return undefined;
  const normalized = Math.max(1, Math.trunc(limit));
  return Math.min(normalized, PRODUCTOS_MAX_LIMIT);
}

function normalizeProductSortOrder(
  value?: ProductSortOrder
): 'ASC' | 'DESC' | undefined {
  if (!value) {
    return undefined;
  }

  return String(value).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
}

function buildProductosQueryString(params?: ProductosQueryParams): string {
  if (!params) return `?limit=${PRODUCTOS_MAX_LIMIT}`;

  const search = new URLSearchParams();

  const normalizedPage = normalizePage(params.page);
  const normalizedLimit = normalizeLimit(params.limit);

  if (normalizedPage != null) search.set('page', String(normalizedPage));
  if (normalizedLimit != null) search.set('limit', String(normalizedLimit));
  if (params.searchTerm?.trim())
    search.set('searchTerm', params.searchTerm.trim());
  if (params.codigoBarras?.trim())
    search.set('codigoBarras', params.codigoBarras.trim());
  if (params.tipo) search.set('tipo', params.tipo);
  if (params.categorias?.length)
    search.set('categorias', params.categorias.join(','));
  if (params.alergenos?.length)
    search.set('alergenos', params.alergenos.join(','));
  if (params.sortBy?.trim()) search.set('sortBy', params.sortBy.trim());

  const normalizedOrder = normalizeProductSortOrder(params.order);
  if (normalizedOrder) search.set('order', normalizedOrder);

  const qs = search.toString();
  return qs ? `?${qs}` : `?limit=${PRODUCTOS_MAX_LIMIT}`;
}

function clearExpiredProductosCache() {
  const now = Date.now();

  productosRequestCache.forEach((entry, key) => {
    if (entry.expiresAt <= now) {
      productosRequestCache.delete(key);
    }
  });
}

export function invalidateProductosCache() {
  productosRequestCache.clear();
}

async function requestProductos(
  query: string
): Promise<PaginatedData<Producto>> {
  clearExpiredProductosCache();

  const cacheKey = query;
  const cached = productosRequestCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const requestPromise = baseFetch(`/productos${query}`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Error al obtener productos: ${response.status} ${response.statusText}`
        );
      }

      const body = (await response.json()) as ApiResponse<
        PaginatedData<Producto>
      >;
      return body.data;
    })
    .catch((error) => {
      productosRequestCache.delete(cacheKey);
      throw error;
    });

  productosRequestCache.set(cacheKey, {
    promise: requestPromise,
    expiresAt: Date.now() + PRODUCTOS_CACHE_TTL_MS,
  });

  return requestPromise;
}

export async function fetchProductos(
  page: number = 1,
  limit: number = 10,
  search: string = '',
  categorias: string[] = [],
  sortBy?: string,
  sortOrder?: ProductSortOrder
): Promise<PaginatedData<Producto>> {
  const query = buildProductosQueryString({
    page,
    limit,
    searchTerm: search,
    categorias: categorias.length > 0 ? categorias : undefined,
    sortBy,
    order: sortOrder,
  });
  return requestProductos(query);
}

// ─── Tipos para listados ──────────────────────────────────────────────────

export type ProductosPaginatedResult = PaginatedData<Producto>;

export async function fetchAllProductos(
  params?: Omit<ProductosQueryParams, 'page' | 'limit'>
): Promise<Producto[]> {
  const firstPage = await fetchProductosPaginated({
    ...params,
    page: 1,
    limit: PRODUCTOS_MAX_LIMIT,
  });

  if (firstPage.totalPages <= 1) {
    return firstPage.data;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      fetchProductosPaginated({
        ...params,
        page: index + 2,
        limit: PRODUCTOS_MAX_LIMIT,
      })
    )
  );

  return [firstPage.data, ...remainingPages.map((page) => page.data)].flat();
}

export async function fetchProductosPaginated(
  params?: ProductosQueryParams
): Promise<ProductosPaginatedResult> {
  const query = buildProductosQueryString({
    limit: PRODUCTOS_DEFAULT_LIMIT,
    ...params,
  });
  const inner = await requestProductos(query);
  if (!inner || !Array.isArray(inner.data)) {
    return {
      data: [],
      total: 0,
      page: 1,
      limit: PRODUCTOS_DEFAULT_LIMIT,
      totalPages: 1,
    };
  }
  return {
    data: inner.data,
    total: inner.total ?? inner.data.length,
    page: inner.page ?? 1,
    limit: inner.limit ?? PRODUCTOS_DEFAULT_LIMIT,
    totalPages: inner.totalPages ?? 1,
  };
}

export async function createProducto(
  producto: ProductoMutationPayload
): Promise<Producto> {
  invalidateProductosCache();
  const response = await baseFetch('/productos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Error al crear producto: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<Producto>;
  return body.data;
}

export async function updateProducto(
  id: string,
  producto: ProductoMutationPayload
): Promise<Producto> {
  invalidateProductosCache();
  const response = await baseFetch(`/productos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Error al actualizar producto: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<Producto>;
  return body.data;
}

export async function getProductoByBarcode(
  barcode: string
): Promise<Producto | null> {
  const query = new URLSearchParams({ codigoBarras: barcode });
  const response = await baseFetch(`/productos?${query.toString()}`);
  if (!response.ok) return null;
  const body = (await response.json()) as ApiResponse<PaginatedData<Producto>>;
  const list = body.data.data;
  return list.length > 0 ? list[0] : null;
}

export async function searchProductosByName(name: string): Promise<Producto[]> {
  const query = new URLSearchParams({ searchTerm: name, limit: '10' });
  const response = await baseFetch(`/productos?${query.toString()}`);
  if (!response.ok) return [];
  const body = (await response.json()) as ApiResponse<PaginatedData<Producto>>;
  return body.data.data;
}

export async function getProductoById(id: string): Promise<Producto | null> {
  const response = await baseFetch(`/productos/${id}`);
  if (!response.ok) return null;
  const body = (await response.json()) as ApiResponse<Producto>;
  return body.data;
}

export async function fetchHistorialPrecios(
  productoId: string,
  proveedorId?: string
): Promise<HistorialPrecio[]> {
  const query = new URLSearchParams();
  if (proveedorId) query.set('proveedorId', proveedorId);
  const response = await baseFetch(
    `/productos/${productoId}/historial-precios?${query.toString()}`
  );
  if (!response.ok) {
    throw new Error(
      `Error al obtener historial de precios: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<HistorialPrecio[]>;
  return body.data;
}
