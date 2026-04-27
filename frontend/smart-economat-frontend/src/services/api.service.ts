import i18n from '../i18n';
import { eventBus, AUTH_EVENTS } from '../utils/eventBus';

/**
 * Documentación en español.
 */

const API_BASE = '/api/v1';
const INVALID_ID_TOKENS = new Set(['', 'undefined', 'null', 'nan']);

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
 * Documentación en español.
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
 * Documentación en español.
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
 * Documentación en español.
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
 * Documentación en español.
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
 * Documentación en español.
 */
export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Documentación en español.
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
 * Documentación en español.
 */
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// ─── Utilidades de `fetch` ──────────────────────────────────────────────────

/**
 * Documentación en español.
 */
export async function baseFetch(
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
 * Documentación en español.
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
 * Documentación en español.
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
 * Documentación en español.
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
 * Documentación en español.
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
 * Documentación en español.
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
