import i18n from '../i18n';
import { eventBus, AUTH_EVENTS } from '../utils/eventBus';

/**
 * Cliente HTTP centralizado para la comunicación con el backend (API v1).
 * Gestiona automáticamente headers, validaciones de contratos, internacionalización
 * y redirecciones por falta de autorización.
 */

const API_BASE = '/api/v1';
const INVALID_ID_TOKENS = new Set(['', 'undefined', 'null', 'nan']);

const FILTER_ALIAS_MAP = {
  search: ['search', 'searchTerm'],
  status: ['status', 'estado'],
  dateFrom: ['dateFrom', 'fechaDesde', 'startDate'],
  dateTo: ['dateTo', 'fechaHasta', 'endDate'],
} as const;

type CanonicalFilterKey = keyof typeof FILTER_ALIAS_MAP;

type CanonicalFilters = {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
};

/** Alias público (GlobalFilters) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type GlobalFilters = CanonicalFilters & Record<string, unknown>;

function isIdLikeKey(key: string): boolean {
  return /^(id|.*Id|.*Ids|.*_id|.*_ids)$/.test(key);
}

function isInvalidIdToken(value: string): boolean {
  const normalizedValue = value.trim().toLowerCase();
  return (
    INVALID_ID_TOKENS.has(normalizedValue) || normalizedValue.startsWith(':')
  );
}

/**
 * Convierte un objeto de filtros (incluyendo search, status, dateFrom, dateTo, y filtros dinámicos)
 * en una instancia de URLSearchParams para ser usada en fetch.
 */
/**
 * Expone "buildQueryParams" en smart-economat-frontend (SPA).
 * @undefined {Record<string, unknown>} params - Entrada efectiva esperada por el contrato.
 * @undefined {number} defaultLimit - Entrada efectiva esperada por el contrato.
 * @undefined {number} maxLimit - Entrada efectiva esperada por el contrato.
 * @undefined {URLSearchParams} Datos efectivos después de ejecutar la operación.
 */
export function buildQueryParams(
  params: Record<string, unknown>,
  defaultLimit: number = 20,
  maxLimit: number = 50
): URLSearchParams {
  const requestedLimit =
    typeof params.limit === 'number' ? params.limit : defaultLimit;
  const safeLimit = Math.min(Math.max(1, requestedLimit), maxLimit);
  const normalizedFilters = normalizeGlobalFilters(params);

  const requestedPage = typeof params.page === 'number' ? params.page : 1;
  const searchParams = new URLSearchParams({
    page: String(Math.max(1, requestedPage)),
    limit: String(safeLimit),
  });

  const setCanonicalFilter = (key: CanonicalFilterKey, value: unknown) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    const canonicalKey = FILTER_ALIAS_MAP[key][0];
    const legacyKey = FILTER_ALIAS_MAP[key][1] || canonicalKey;
    const queryKey = legacyKey;

    searchParams.set(queryKey, String(value));
  };

  setCanonicalFilter('search', normalizedFilters.search);
  setCanonicalFilter('status', normalizedFilters.status);
  setCanonicalFilter('dateFrom', normalizedFilters.dateFrom);
  setCanonicalFilter('dateTo', normalizedFilters.dateTo);

  Object.entries(normalizedFilters).forEach(([key, value]) => {
    const canonicalFilterKeys = Object.keys(
      FILTER_ALIAS_MAP
    ) as CanonicalFilterKey[];
    if (canonicalFilterKeys.includes(key as CanonicalFilterKey)) {
      return;
    }

    if (
      key !== 'page' &&
      key !== 'limit' &&
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      if (Array.isArray(value)) {
        searchParams.set(key, value.join(','));
      } else {
        // Normalizar 'order' a mayúsculas para compatibilidad con backend @IsIn(['ASC', 'DESC'])
        const finalValue =
          key === 'order' ? String(value).toUpperCase() : String(value);
        searchParams.set(key, finalValue);
      }
    }
  });

  return searchParams;
}

/**
 * Expone "normalizeGlobalFilters" en smart-economat-frontend (SPA).
 * @undefined {Record<string, unknown>} params - Entrada efectiva esperada por el contrato.
 * @undefined {GlobalFilters} Datos efectivos después de ejecutar la operación.
 */
export function normalizeGlobalFilters(
  params: Record<string, unknown>
): GlobalFilters {
  const normalized: GlobalFilters = {};
  const aliases = new Set<string>(Object.values(FILTER_ALIAS_MAP).flat());

  const pickValue = (keys: readonly string[]): unknown => {
    for (const key of keys) {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    return undefined;
  };

  const search = pickValue(FILTER_ALIAS_MAP.search);
  const status = pickValue(FILTER_ALIAS_MAP.status);
  const dateFrom = pickValue(FILTER_ALIAS_MAP.dateFrom);
  const dateTo = pickValue(FILTER_ALIAS_MAP.dateTo);

  if (search !== undefined) {
    normalized.search = String(search).trim();
  }

  if (status !== undefined) {
    normalized.status = String(status).trim();
  }

  if (dateFrom !== undefined) {
    normalized.dateFrom = String(dateFrom).trim();
  }

  if (dateTo !== undefined) {
    normalized.dateTo = String(dateTo).trim();
  }

  for (const [key, value] of Object.entries(params)) {
    if (aliases.has(key)) {
      continue;
    }

    if (value === undefined || value === null || value === '') {
      continue;
    }

    normalized[key] = value;
  }

  return normalized;
}

/**
 * Intenta parsear el cuerpo de una petición como JSON de forma segura.
 * @param body Cuerpo de la petición.
 * @returns Objeto parseado o null si falla.
 */
function parseJsonBody(body: BodyInit | null | undefined): unknown | null {
  if (!body || typeof body !== 'string') {
    return null;
  }

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function findInvalidIdInValue(
  value: unknown,
  location: string = 'body'
): string | null {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const item = value[index];
      const nestedLocation = `${location}[${index}]`;
      const nestedIssue = findInvalidIdInValue(item, nestedLocation);
      if (nestedIssue) {
        return nestedIssue;
      }
    }

    return null;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nextLocation = `${location}.${key}`;

    if (isIdLikeKey(key)) {
      if (Array.isArray(nestedValue)) {
        for (let index = 0; index < nestedValue.length; index += 1) {
          const item = nestedValue[index];
          if (
            item == null ||
            (typeof item === 'number' && Number.isNaN(item)) ||
            (typeof item === 'string' && isInvalidIdToken(item))
          ) {
            return `${nextLocation}[${index}]`;
          }
        }
      } else if (
        nestedValue == null ||
        (typeof nestedValue === 'number' && Number.isNaN(nestedValue)) ||
        (typeof nestedValue === 'string' && isInvalidIdToken(nestedValue))
      ) {
        return nextLocation;
      }
    }

    const nestedIssue = findInvalidIdInValue(nestedValue, nextLocation);
    if (nestedIssue) {
      return nestedIssue;
    }
  }

  return null;
}

/**
 * Analiza una ruta de URL en busca de segmentos que parezcan tokens de ID no resueltos
 * (ej. ':id', 'null', 'undefined').
 * @param path Ruta completa con query strings.
 * @returns El segmento inválido encontrado o null.
 */
function findInvalidIdInPath(path: string): string | null {
  const [pathname, rawQuery = ''] = path.split('?');
  const pathSegments = pathname.split('/');

  for (let index = 1; index < pathSegments.length; index += 1) {
    const segment = decodeURIComponent(pathSegments[index] || '').trim();
    const nextSegment = pathSegments[index + 1];

    if (!segment) {
      if (nextSegment) {
        return `path segment ${index}`;
      }
      continue;
    }

    if (isInvalidIdToken(segment)) {
      return `path segment ${index}`;
    }
  }

  const queryParams = new URLSearchParams(rawQuery);
  for (const [key, value] of Array.from(queryParams.entries())) {
    if (!isIdLikeKey(key)) {
      continue;
    }

    if (key.endsWith('Ids') || key.endsWith('_ids')) {
      const ids = value.split(',');
      for (let index = 0; index < ids.length; index += 1) {
        const item = ids[index];
        if (isInvalidIdToken(item)) {
          return `query.${key}[${index}]`;
        }
      }
      continue;
    }

    if (isInvalidIdToken(value)) {
      return `query.${key}`;
    }
  }

  return null;
}

function getRequestContractIssue(
  path: string,
  body: BodyInit | null | undefined
): string | null {
  const pathIssue = findInvalidIdInPath(path);
  if (pathIssue) {
    return pathIssue;
  }

  const jsonBody = parseJsonBody(body);
  if (!jsonBody) {
    return null;
  }

  return findInvalidIdInValue(jsonBody);
}

/**
 * Resuelve la URL pública de un archivo almacenado, manejando rutas relativas,
 * absolutas y blobs temporales.
 * @param filePath Ruta del archivo devuelta por el backend.
 * @returns URL completa y accesible desde el navegador.
 */
export function resolveStoredFileUrl(filePath?: string | null): string {
  if (!filePath) return '';

  const trimmedPath = filePath.trim();
  if (!trimmedPath) return '';

  if (/^https?:\/\//i.test(trimmedPath) || trimmedPath.startsWith('blob:')) {
    return trimmedPath;
  }

  if (trimmedPath.startsWith(`${API_BASE}/`)) {
    return trimmedPath;
  }

  const uploadMatch = trimmedPath.match(/(?:^|\/)uploads\/(.+)$/i);
  if (uploadMatch?.[1]) {
    return `${API_BASE}/archivos/content/${uploadMatch[1]}`;
  }

  return trimmedPath;
}

// ─── Tipos compartidos de la API ────────────────────────────────────────────

/**
 * Estructura estándar de las respuestas del backend.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: unknown;
}

/** Clase pública (ApiError). Paquete: smart-economat-frontend (SPA). */
export class ApiError extends Error {
  status: number;
  payload: unknown;

  /**
   * Construye la instancia configurada.
   * @undefined {string} message - Entrada efectiva esperada por el contrato.
   * @undefined {number} status - Entrada efectiva esperada por el contrato.
   * @undefined {unknown} payload - Entrada efectiva esperada por el contrato.
   */
  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Determina si un error HTTP es transitorio y candidato para reintento.
 * @param status Código de estado HTTP.
 * @returns true si es reintentable.
 */
export function isTransientError(status: number): boolean {
  // 5xx (Server Errors), 429 (Too Many Requests), 408 (Timeout)
  return status >= 500 || status === 429 || status === 408;
}

/**
 * Estructura para datos paginados devueltos por el backend.
 */
export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Extrae una lista plana de elementos desde un payload que puede ser
 * una lista simple o un objeto paginado.
 * @param payload Datos devueltos por la API.
 * @returns Array de elementos del tipo especificado.
 */
export function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const paginated = payload as PaginatedData<T> | null | undefined;
  if (paginated != null && Array.isArray(paginated.data)) return paginated.data;
  return [];
}

/**
 * Interpreta el envelope paginado dentro de `ApiResponse.data`.
 */
export function unwrapPaginated<T>(payload: unknown): PaginatedData<T> | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const paginated = payload as Partial<PaginatedData<T>>;
  if (!Array.isArray(paginated.data)) {
    return null;
  }
  return paginated as PaginatedData<T>;
}

/**
 * Expone "extractApiMessage" en smart-economat-frontend (SPA).
 * @undefined {unknown} payload - Entrada efectiva esperada por el contrato.
 * @undefined {string | null} Datos efectivos después de ejecutar la operación.
 */
export function extractApiMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as {
    message?: string | string[];
    error?: { message?: string | string[] } | string;
  };

  if (Array.isArray(candidate.message)) {
    return candidate.message.join(', ');
  }

  if (typeof candidate.message === 'string' && candidate.message.trim()) {
    return candidate.message;
  }

  if (
    candidate.error &&
    typeof candidate.error === 'object' &&
    'message' in candidate.error
  ) {
    const nestedMessage = candidate.error.message;
    if (Array.isArray(nestedMessage)) {
      return nestedMessage.join(', ');
    }
    if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
      return nestedMessage;
    }
  }

  if (typeof candidate.error === 'string' && candidate.error.trim()) {
    return candidate.error;
  }

  return null;
}

/**
 * Interpreta y normaliza datos de entrada o texto estructurado.
 * @undefined {Response} response - Entrada efectiva esperada por el contrato.
 * @undefined {string} fallbackMessage - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<ApiResponse<T>>} Datos efectivos después de ejecutar la operación.
 */
export async function parseApiResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<ApiResponse<T>> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      extractApiMessage(payload) || fallbackMessage,
      response.status,
      payload
    );
  }

  if (!payload || typeof payload !== 'object') {
    throw new ApiError(fallbackMessage, response.status, payload);
  }

  return payload as ApiResponse<T>;
}

/**
 * Recupera el valor de una cookie por su nombre.
 * @param name Nombre de la cookie.
 * @returns Valor de la cookie o null si no existe.
 */
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// ─── Utilidades de `fetch` ──────────────────────────────────────────────────

/**
 * Realiza una petición `fetch` básica al backend, inyectando headers de seguridad,
 * idioma y credenciales (cookies httpOnly).
 * @param path Ruta del endpoint (sin prefijo de API).
 * @param options Opciones estándar de RequestInit.
 * @returns Promesa con la respuesta de la red.
 * @throws ApiError Si la validación local falla o la respuesta no es 401.
 */
export async function baseFetch(
  path: string,
  options: RequestInit = {},
  retryOptions: { maxRetries?: number; delayMs?: number; silent?: boolean } = {}
): Promise<Response> {
  const {
    maxRetries = 1,
    delayMs = 1000,
    silent: _silent = false,
  } = retryOptions;
  let lastError: unknown;
  void _silent;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await executeFetch(path, options);

      if (response.ok) {
        return response;
      }

      // Manejo especial de 401 (Sesión expirada) - No se reintenta
      if (response.status === 401) {
        eventBus.emit(AUTH_EVENTS.UNAUTHORIZED);
        const payload = await response
          .clone()
          .json()
          .catch(() => null);
        throw new ApiError(
          extractApiMessage(payload) || 'Sesión expirada o no autorizada',
          response.status,
          payload
        );
      }

      // Si es un error transitorio y tenemos reintentos pendientes, esperamos y reintentamos
      if (isTransientError(response.status) && attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * (attempt + 1))
        );
        continue;
      }

      // Si no es reintentable o se agotaron los intentos, lanzamos el error
      const payload = await response
        .clone()
        .json()
        .catch(() => null);
      throw new ApiError(
        extractApiMessage(payload) ||
          `Error ${response.status}: ${response.statusText}`,
        response.status,
        payload
      );
    } catch (error) {
      lastError = error;

      // Si el error es de red (fetch falló) y tenemos reintentos, reintentamos
      if (error instanceof TypeError && attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * (attempt + 1))
        );
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

/**
 * Ejecución interna de fetch con headers y seguridad.
 */
async function executeFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const requestContractIssue = getRequestContractIssue(path, options.body);
  if (requestContractIssue) {
    throw new ApiError(
      `Solicitud inválida antes de enviar al backend: id vacío o no resuelto en ${requestContractIssue}.`,
      400,
      { path, issue: requestContractIssue }
    );
  }

  const headers = new Headers(options.headers);

  // Internationalization: Send the current UI language to the backend
  if (!headers.has('Accept-Language') && i18n.language) {
    headers.set('Accept-Language', i18n.language);
  }

  // Protección CSRF: Añadir token desde la cookie si existe
  const csrfToken = getCookie('XSRF-TOKEN');
  if (csrfToken) {
    headers.set('X-XSRF-TOKEN', csrfToken);
  }

  // Nota: Ya no se adjunta el token desde localStorage por seguridad (XSS).
  // El backend utiliza la cookie 'access_token' (httpOnly) gestionada automáticamente
  // por el navegador gracias a credentials: 'include'.

  // Añadir Content-Type si corresponde
  if (
    !headers.has('Content-Type') &&
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers.set('Content-Type', 'application/json');
  }

  return await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
}

/**
 * Descarga un archivo desde el servidor y dispara la descarga en el navegador.
 * @param path Ruta del recurso.
 * @param filename Nombre con el que se guardará el archivo.
 */
/**
 * Expone "downloadFile" en smart-economat-frontend (SPA).
 * @undefined {string} path - Entrada efectiva esperada por el contrato.
 * @undefined {string} filename - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function downloadFile(
  path: string,
  filename: string
): Promise<void> {
  const response = await baseFetch(path);

  if (!response.ok) {
    throw new Error(
      `Error al descargar el archivo: ${response.status} ${response.statusText}`
    );
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = url;
  anchor.setAttribute('download', filename);

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
}

/**
 * Genera y abre un documento PDF en una nueva pestaña del navegador.
 * @param path Ruta del endpoint que genera el PDF.
 */
/**
 * Expone "openPdfInNewTab" en smart-economat-frontend (SPA).
 * @undefined {string} path - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function openPdfInNewTab(path: string): Promise<void> {
  const response = await baseFetch(path);

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      extractApiMessage(payload) ||
        `Error al generar el reporte: ${response.status} ${response.statusText}`
    );
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Envía un documento PDF directamente a la cola de impresión del navegador
 * utilizando un iframe oculto.
 * @param path Ruta del endpoint que genera el PDF.
 */
/**
 * Expone "printPdfFile" en smart-economat-frontend (SPA).
 * @undefined {string} path - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function printPdfFile(path: string): Promise<void> {
  const response = await baseFetch(path);

  if (!response.ok) {
    throw new Error(
      `Error al preparar la impresión del archivo: ${response.status} ${response.statusText}`
    );
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');

  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = url;

  let hasCleanedUp = false;

  const cleanup = () => {
    if (hasCleanedUp) return;
    hasCleanedUp = true;
    iframe.remove();
    URL.revokeObjectURL(url);
  };

  iframe.onload = () => {
    window.setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.open(url, '_blank', 'noopener,noreferrer');
      } finally {
        window.setTimeout(cleanup, 60000);
      }
    }, 350);
  };

  document.body.appendChild(iframe);
}

/**
 * Ejecuta una petición DELETE centralizada para cualquier recurso.
 * @param resourcePath Ruta completa del recurso a eliminar.
 */
/**
 * Elimina o marca entidades siguendo las políticas configuradas.
 * @undefined {string} resourcePath - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function deleteResource(resourcePath: string): Promise<void> {
  const response = await baseFetch(resourcePath, {
    method: 'DELETE',
  });

  // 204 No Content es éxito sin cuerpo
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail =
      extractApiMessage(payload) || `${response.status} ${response.statusText}`;
    throw new ApiError(detail, response.status, payload);
  }
}

/**
 * Sube un archivo físico al servidor utilizando multipart/form-data.
 * @param file Objeto File del navegador.
 * @returns URL final del archivo subido (u optimizada si está disponible).
 */
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await baseFetch('/archivos/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `Error al subir archivo: ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody.message) errorMessage = errorBody.message;
    } catch {
      // sin body JSON
    }
    throw new Error(errorMessage);
  }

  const body = (await response.json()) as ApiResponse<{
    url: string;
    urlOptimized?: string;
  }>;
  // La respuesta viene como: { success, message, data: { id, nombre, url, ... } }
  return body.data.urlOptimized || body.data.url;
}
