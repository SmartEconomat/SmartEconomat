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

export function toOptionalTrimmedString(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }

  const trimmedValue = String(value).trim();
  return trimmedValue ? trimmedValue : undefined;
}

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

export function normalizePageParam(
  page: number | undefined,
  fallback: number = 1
): number {
  if (page == null || Number.isNaN(page)) {
    return fallback;
  }

  return Math.max(1, Math.trunc(page));
}

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
