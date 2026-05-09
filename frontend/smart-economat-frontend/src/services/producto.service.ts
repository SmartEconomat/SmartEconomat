import {
  Producto,
  ProductosQueryParams,
  HistorialPrecio,
} from './producto.types';
import { baseFetch, ApiResponse, PaginatedData } from './api.service';

const PRODUCTOS_CACHE_TTL_MS = 15000;
const PRODUCTOS_BY_ID_CACHE_TTL_MS = 30000;
const PRODUCTOS_CACHE_MAX_ENTRIES = 120;
const PRODUCTOS_MAX_LIMIT = 50;
const PRODUCTOS_DEFAULT_LIMIT = 20;
const PRODUCTOS_FETCH_ALL_MAX_PAGES = 20;

const productosRequestCache = new Map<
  string,
  {
    promise: Promise<PaginatedData<Producto>>;
    expiresAt: number;
  }
>();

const productosByIdRequestCache = new Map<
  string,
  {
    promise: Promise<Producto | null>;
    expiresAt: number;
  }
>();

/** Contrato de tipos público (ProductoProveedorPayload). Contexto: smart-economat-frontend (SPA). */
export interface ProductoProveedorPayload {
  proveedorId: string;
  marcaEspecifica?: string;
  codigoBarras?: string;
  precioUnitario?: number;
}

/** Contrato de tipos público (ProductoMutationPayload). Contexto: smart-economat-frontend (SPA). */
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
  activo?: boolean;
}

import { buildQueryParams } from './api.service';

function buildProductosQueryString(params?: Record<string, unknown>): string {
  if (!params) return `?limit=${PRODUCTOS_MAX_LIMIT}`;

  // Preprocesar params para adaptar a los nombres esperados si es necesario,
  // pero intentaremos usar los estándar.
  const processedParams = { ...params };

  // Categorías y alérgenos vienen como arrays o strings
  if (params.categorias && Array.isArray(params.categorias)) {
    processedParams.categorias = params.categorias.join(',');
  }
  if (params.alergenos && Array.isArray(params.alergenos)) {
    processedParams.alergenos = params.alergenos.join(',');
  }

  const qs = buildQueryParams(
    processedParams,
    PRODUCTOS_DEFAULT_LIMIT,
    PRODUCTOS_MAX_LIMIT
  ).toString();
  return qs ? `?${qs}` : `?limit=${PRODUCTOS_MAX_LIMIT}`;
}

function pruneProductosCache<T>(cache: Map<string, T>): void {
  while (cache.size > PRODUCTOS_CACHE_MAX_ENTRIES) {
    const oldestEntry = cache.keys().next();
    if (oldestEntry.done) {
      break;
    }
    cache.delete(oldestEntry.value);
  }
}

function clearExpiredProductosCache<T extends { expiresAt: number }>(
  cache: Map<string, T>
) {
  const now = Date.now();

  cache.forEach((entry, key) => {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  });
}

/**
 * Invalida manualmente todas las cachés de productos.
 * Útil tras operaciones de creación, edición o borrado.
 */
/**
 * Expone "invalidateProductosCache" en smart-economat-frontend (SPA).
 * @undefined {void} Datos efectivos después de ejecutar la operación.
 */
export function invalidateProductosCache() {
  productosRequestCache.clear();
  productosByIdRequestCache.clear();
}

async function requestProductos(
  query: string
): Promise<PaginatedData<Producto>> {
  clearExpiredProductosCache(productosRequestCache);

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
  pruneProductosCache(productosRequestCache);

  return requestPromise;
}

async function requestProductoById(id: string): Promise<Producto | null> {
  const normalizedId = id.trim();
  if (!normalizedId) {
    return null;
  }

  clearExpiredProductosCache(productosByIdRequestCache);

  const cacheKey = normalizedId;
  const cached = productosByIdRequestCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const requestPromise = baseFetch(`/productos/${normalizedId}`)
    .then(async (response) => {
      if (!response.ok) {
        return null;
      }

      const body = (await response.json()) as ApiResponse<Producto>;
      return body.data ?? null;
    })
    .catch((error) => {
      productosByIdRequestCache.delete(cacheKey);
      throw error;
    });

  productosByIdRequestCache.set(cacheKey, {
    promise: requestPromise,
    expiresAt: Date.now() + PRODUCTOS_BY_ID_CACHE_TTL_MS,
  });
  pruneProductosCache(productosByIdRequestCache);

  return requestPromise;
}

/**
 * Expone "fetchProductos" en smart-economat-frontend (SPA).
 * @undefined {Record<string, unknown>} params - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PaginatedData<Producto>>} Datos efectivos después de ejecutar la operación.
 */
export async function fetchProductos(
  page: number,
  limit: number,
  searchTerm: string,
  alergenos: string[],
  sortBy: string,
  order: 'asc' | 'desc' | 'ASC' | 'DESC'
): Promise<PaginatedData<Producto>>;
export async function fetchProductos(
  params: Record<string, unknown>
): Promise<PaginatedData<Producto>>;
export async function fetchProductos(
  arg1: number | Record<string, unknown>,
  arg2?: number,
  arg3?: string,
  arg4?: string[],
  arg5?: string,
  arg6?: 'asc' | 'desc' | 'ASC' | 'DESC'
): Promise<PaginatedData<Producto>> {
  const params =
    typeof arg1 === 'number'
      ? {
          page: arg1,
          limit: arg2,
          searchTerm: arg3,
          alergenos: arg4 ?? [],
          sortBy: arg5,
          order: arg6,
        }
      : arg1;
  const query = buildProductosQueryString(params);
  return requestProductos(query);
}

// ─── Tipos para listados ──────────────────────────────────────────────────

/** Alias público (ProductosPaginatedResult) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type ProductosPaginatedResult = PaginatedData<Producto>;

/**
 * Recupera todos los productos que coinciden con los filtros, recorriendo todas
 * las páginas disponibles (con un límite de seguridad para evitar bloqueos).
 * @param params Parámetros de búsqueda y filtrado.
 * @returns Lista plana de todos los productos encontrados.
 */
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

  const cappedTotalPages = Math.min(
    firstPage.totalPages,
    PRODUCTOS_FETCH_ALL_MAX_PAGES
  );

  if (firstPage.totalPages > PRODUCTOS_FETCH_ALL_MAX_PAGES) {
    console.warn(
      `fetchAllProductos limitado a ${PRODUCTOS_FETCH_ALL_MAX_PAGES} páginas para evitar sobrecarga.`
    );
  }

  const remainingPages = await Promise.all(
    Array.from({ length: cappedTotalPages - 1 }, (_, index) =>
      fetchProductosPaginated({
        ...params,
        page: index + 2,
        limit: PRODUCTOS_MAX_LIMIT,
      })
    )
  );

  return [firstPage.data, ...remainingPages.map((page) => page.data)].flat();
}

/**
 * Wrapper sobre `fetchProductos` que acepta un objeto de parámetros consolidado.
 * @param params DTO de parámetros de consulta.
 * @returns Datos paginados normalizados.
 */
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

/**
 * Crea un nuevo producto en el catálogo maestro.
 * @param producto Datos del producto e ingredientes/proveedores iniciales.
 * @returns El producto creado.
 * @throws Error Con el detalle del fallo devuelto por el backend.
 */
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
    let message = `Error al procesar producto: ${response.status}`;
    if (errorBody.message) {
      message = Array.isArray(errorBody.message)
        ? errorBody.message.join('\n')
        : String(errorBody.message);
    }
    throw new Error(message);
  }
  const body = (await response.json()) as ApiResponse<Producto>;
  return body.data;
}

/**
 * Actualiza los datos de un producto existente.
 * @param id UUID del producto.
 * @param producto Nuevos datos a aplicar.
 * @returns El producto actualizado.
 */
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
    let message = `Error al actualizar producto: ${response.status}`;
    if (errorBody.message) {
      message = Array.isArray(errorBody.message)
        ? errorBody.message.join('\n')
        : String(errorBody.message);
    }
    throw new Error(message);
  }
  const body = (await response.json()) as ApiResponse<Producto>;
  return body.data;
}

/**
 * Expone "restoreProducto" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Producto>} Datos efectivos después de ejecutar la operación.
 */
export async function restoreProducto(id: string): Promise<Producto> {
  invalidateProductosCache();
  const response = await baseFetch(`/productos/${id}/restore`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    let message = `Error al restaurar producto: ${response.status}`;
    if (errorBody.message) {
      message = Array.isArray(errorBody.message)
        ? errorBody.message.join('\n')
        : String(errorBody.message);
    }
    throw new Error(message);
  }
  const body = (await response.json()) as ApiResponse<Producto>;
  return body.data;
}

/**
 * Busca un producto específico mediante su código de barras (EAN, UPC, etc).
 * @param barcode Código de barras a buscar.
 * @returns El producto encontrado o null.
 */
export async function getProductoByBarcode(
  barcode: string
): Promise<Producto | null> {
  const normalizedBarcode = barcode.trim();
  if (!normalizedBarcode) {
    return null;
  }

  const query = buildProductosQueryString({
    page: 1,
    limit: 1,
    codigoBarras: normalizedBarcode,
  });

  const response = await requestProductos(query);
  const list = response.data;
  return list.length > 0 ? list[0] : null;
}

/**
 * Busca productos por coincidencia parcial en el nombre.
 * @param name Término de búsqueda.
 * @returns Lista de productos coincidentes (máx 10).
 */
export async function searchProductosByName(name: string): Promise<Producto[]> {
  const normalizedName = name.trim();
  if (!normalizedName) {
    return [];
  }

  const query = buildProductosQueryString({
    page: 1,
    limit: 10,
    searchTerm: normalizedName,
    sortBy: 'nombre',
    order: 'ASC',
  });

  const response = await requestProductos(query);
  return response.data;
}

/**
 * Recupera un producto por su identificador único (UUID).
 * @param id UUID del producto.
 */
/**
 * Obtiene valores o vistas materializadas.
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Producto | null>} Datos efectivos después de ejecutar la operación.
 */
export async function getProductoById(id: string): Promise<Producto | null> {
  return requestProductoById(id);
}

/**
 * Obtiene el historial de variaciones de precio de un producto,
 * opcionalmente filtrado por un proveedor específico.
 * @param productoId UUID del producto.
 * @param proveedorId UUID del proveedor (opcional).
 */
/**
 * Expone "fetchHistorialPrecios" en smart-economat-frontend (SPA).
 * @undefined {string} productoId - Entrada efectiva esperada por el contrato.
 * @undefined {string | undefined} proveedorId - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<HistorialPrecio[]>} Datos efectivos después de ejecutar la operación.
 */
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

/**
 * Solicita al backend la generación de un nuevo código de barras EAN-13 único.
 * Utiliza el prefijo de la organización definido en la configuración global.
 * @returns El nuevo código EAN-13 generado.
 */
/**
 * Genera artefactos sintéticos a partir del estado conocido.
 * @undefined {Promise<string>} Datos efectivos después de ejecutar la operación.
 */
export async function generateProductoEan13(): Promise<string> {
  const response = await baseFetch('/productos/generar-ean13');

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Error al generar codigo EAN-13: ${response.status}`
    );
  }

  const body = (await response.json()) as ApiResponse<{
    codigo_barras?: string;
  }>;
  const codigoBarras = body.data?.codigo_barras?.trim();

  if (!codigoBarras) {
    throw new Error('El backend no devolvio un codigo EAN-13 valido.');
  }

  return codigoBarras;
}
