import { getResolvedLocale } from './intlFormat';

/**
 * Interpreta y normaliza datos de entrada o texto estructurado.
 * @undefined {string | number | null | undefined} value - Entrada efectiva esperada por el contrato.
 * @undefined {number | null} Datos efectivos después de ejecutar la operación.
 */
export const parseLocalizedNumber = (
  value: string | number | null | undefined
): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  // Normalización global: eliminar espacios y convertir coma en punto
  const normalized = trimmed.replace(/\s+/g, '').replace(',', '.');
  const parsed = parseFloat(normalized);

  // Verificamos que sea un número válido y que no sea NaN
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Normaliza una cadena de entrada numérica permitiendo caracteres válidos
 * durante la edición (números, un solo punto o una sola coma, y opcionalmente signo negativo).
 */
/**
 * Expone "normalizeNumericInput" en smart-economat-frontend (SPA).
 * @undefined {string} value - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} allowNegative - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export const normalizeNumericInput = (
  value: string,
  allowNegative: boolean = false
): string => {
  // Solo permitir números, una coma, un punto y opcionalmente el signo menos al inicio
  const regex = allowNegative ? /[^0-9.,-]/g : /[^0-9.,]/g;
  let normalized = value.replace(regex, '');

  // Manejar el signo menos: solo puede estar en la posición 0
  if (allowNegative && normalized.includes('-')) {
    const isNegative = normalized.startsWith('-');
    normalized = (isNegative ? '-' : '') + normalized.replace(/-/g, '');
  }

  // Si hay múltiples separadores, nos quedamos con el primero
  const firstSeparatorIndex = normalized.search(/[.,]/);
  if (firstSeparatorIndex !== -1) {
    const part1 = normalized.slice(0, firstSeparatorIndex + 1);
    const part2 = normalized
      .slice(firstSeparatorIndex + 1)
      .replace(/[.,]/g, '');
    normalized = part1 + part2;
  }

  return normalized;
};

/**
 * Expone "formatLocalizedNumber" en smart-economat-frontend (SPA).
 * @undefined {number | null | undefined} value - Entrada efectiva esperada por el contrato.
 * @undefined {number} maxFractionDigits - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export const formatLocalizedNumber = (
  value: number | null | undefined,
  maxFractionDigits: number = 3
): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '0';
  }

  return new Intl.NumberFormat(getResolvedLocale(), {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
};

/**
 * Expone "sanitizeLocalizedDecimalInput" en smart-economat-frontend (SPA).
 * @undefined {string} value - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export const sanitizeLocalizedDecimalInput = (value: string): string =>
  value.replace(/\./g, ',').replace(/[^0-9,]/g, '');
