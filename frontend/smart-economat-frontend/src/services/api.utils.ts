/**
 * Campos técnicos base que suelen ser ignorados o eliminados en payloads de creación/actualización.
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
 * Limpia un objeto eliminando los campos técnicos automáticos de la base de datos (id, createdAt, etc.).
 * Útil antes de enviar datos a un endpoint de creación o actualización.
 * @param data Objeto original con todos los campos.
 * @returns Una copia del objeto sin los campos técnicos.
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
 * Normaliza un valor a string limpio (trim) o devuelve undefined si está vacío o es nulo.
 * @param value El valor a normalizar.
 * @returns El string limpio o undefined.
 */
export function toOptionalTrimmedString(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }

  const trimmedValue = String(value).trim();
  return trimmedValue ? trimmedValue : undefined;
}

/**
 * Intenta convertir un valor a número finito o devuelve undefined si no es posible.
 * @param value El valor a convertir.
 * @returns El número convertido o undefined.
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
 * Normaliza el parámetro de página asegurando que sea un entero positivo (mínimo 1).
 * @param page Valor de la página recibido.
 * @param fallback Valor por defecto si la entrada no es válida.
 * @returns Número de página normalizado.
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
 * Normaliza el parámetro de límite (registros por página) asegurando un rango válido.
 * @param limit Valor del límite recibido.
 * @param fallback Valor por defecto.
 * @param max Valor máximo permitido para evitar sobrecarga del servidor.
 * @returns Límite normalizado.
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
