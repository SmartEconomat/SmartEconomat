/**
 * Campos de metadatos de BaseEntity que el backend genera automáticamente
 * y no deben enviarse en los requests de creación/actualización.
 */
const BASE_ENTITY_FIELDS = [
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'deletedBy',
  'version',
];

/**
 * Elimina los campos de metadatos de BaseEntity de un objeto
 * antes de enviarlo al backend como payload de creación/actualización.
 *
 * @param {T} data - The object to clean.
 * @returns {Partial<T>} A shallow copy of `data` without the base entity fields.
 * @example
 * const payload = cleanPayload({ id: '123', nombre: 'Test', createdAt: '...' });
 * // payload === { nombre: 'Test' }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cleanPayload<T extends Record<string, any>>(
  data: T
): Partial<T> {
  const cleaned = { ...data };
  BASE_ENTITY_FIELDS.forEach((field) => {
    delete cleaned[field];
  });
  return cleaned as Partial<T>;
}

/**
 * Converts an arbitrary value to a trimmed string, returning `undefined` for
 * null/undefined values and empty strings after trimming.
 *
 * @param {unknown} value - The value to convert.
 * @returns {string | undefined} The trimmed string, or `undefined` if empty.
 * @example
 * toOptionalTrimmedString('  hello  '); // 'hello'
 * toOptionalTrimmedString('');          // undefined
 * toOptionalTrimmedString(null);        // undefined
 */
export function toOptionalTrimmedString(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }

  const trimmedValue = String(value).trim();
  return trimmedValue ? trimmedValue : undefined;
}

/**
 * Converts an arbitrary value to a finite number, returning `undefined` for
 * non-numeric, empty, or non-finite values (Infinity, NaN).
 *
 * @param {unknown} value - The value to convert.
 * @returns {number | undefined} A finite number, or `undefined` if conversion fails.
 * @example
 * toFiniteNumberOrUndefined('3.14'); // 3.14
 * toFiniteNumberOrUndefined('');    // undefined
 * toFiniteNumberOrUndefined(Infinity); // undefined
 */
export function toFiniteNumberOrUndefined(value: unknown): number | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value === 'string' && !value.trim()) {
    return undefined;
  }

  const normalizedValue = Number(value);
  return Number.isFinite(normalizedValue) ? normalizedValue : undefined;
}

/**
 * Normalises a `page` query parameter to a safe integer >= 1.
 * Falls back to `fallback` when `page` is null, undefined, or NaN.
 *
 * @param {number | undefined} page - Raw page value from a form or URL param.
 * @param {number} [fallback=1] - Value to return when `page` is not usable.
 * @returns {number} A safe page number >= 1.
 * @example
 * normalizePageParam(undefined); // 1
 * normalizePageParam(0);         // 1
 * normalizePageParam(3);         // 3
 */
export function normalizePageParam(
  page: number | undefined,
  fallback: number = 1
): number {
  if (page == null || Number.isNaN(page)) {
    return fallback;
  }

  return Math.max(1, Math.trunc(page));
}

/**
 * Normalises a `limit` query parameter to a safe integer clamped between 1 and `max`.
 * Falls back to `fallback` when `limit` is null, undefined, or NaN.
 *
 * @param {number | undefined} limit - Raw limit value from a form or URL param.
 * @param {number} [fallback=20] - Value to return when `limit` is not usable.
 * @param {number} [max=50] - Maximum allowed limit.
 * @returns {number} A safe limit value between 1 and `max`.
 * @example
 * normalizeLimitParam(undefined); // 20
 * normalizeLimitParam(100, 20, 50); // 50
 */
export function normalizeLimitParam(
  limit: number | undefined,
  fallback: number = 20,
  max: number = 50
): number {
  if (limit == null || Number.isNaN(limit)) {
    return fallback;
  }

  const normalizedLimit = Math.max(1, Math.trunc(limit));
  return Math.min(normalizedLimit, max);
}
