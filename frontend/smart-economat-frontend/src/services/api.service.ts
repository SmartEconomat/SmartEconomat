import { eventBus, AUTH_EVENTS } from '../utils/eventBus';

/**
 * Servicio API genérico y reutilizable con manejo global de errores.
 */

const API_BASE = '/api/v1';

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
 * Envoltorio estándar del interceptor global del backend.
 * Todos los endpoints devuelven `{ success, message, data }`.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: unknown;
}

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Forma que devuelven los endpoints paginados del backend.
 * Las respuestas de listado tienen la forma `{ data: T[], total, page, limit, totalPages }`.
 */
export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Extrae el array de items de una respuesta que puede ser:
 *  - Un array directo: `T[]`
 *  - Un wrapper paginado: `PaginatedData<T>` (donde los items están en `.data`)
 *
 * Esto es necesario porque el interceptor global envuelve la respuesta en
 * `{ success, message, data }`, y los endpoints paginados añaden otro nivel:
 * `{ data: { data: T[], total, page, ... } }`.
 */
export function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const paginated = payload as PaginatedData<T> | null | undefined;
  if (paginated != null && Array.isArray(paginated.data)) return paginated.data;
  return [];
}

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
 * Helper para obtener el valor de una cookie por nombre.
 */
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// ─── Helpers de fetch ───────────────────────────────────────────────────────

/**
 * Wrapper de fetch que maneja errores comunes (como 401 Unauthorized).
 */
export async function baseFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);

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

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

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

  return response;
}

/**
 * Elimina un recurso en la API mediante su ruta relativa.
 *
 * @param resourcePath - Ruta relativa al recurso, p. ej. `/productos/abc-123`
 * @throws Error si la respuesta HTTP no es 2xx (excepto 204)
 *
 * @example
 * await deleteResource(`/productos/${id}`);
 * await deleteResource(`/proveedores/${id}`);
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
 * Sube un archivo al backend (/archivos/upload).
 * Utiliza FormData (baseFetch gestiona correctamente los headers para FormData).
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
