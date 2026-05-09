import i18n from '../i18n';

/**
 * Obtiene valores o vistas materializadas.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export function getResolvedLocale(): string {
  return i18n.resolvedLanguage ?? i18n.language ?? 'es';
}

function toDate(value: Date | number | string): Date | null {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d;
}

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

/**
 * Expone "formatLocalizedDate" en smart-economat-frontend (SPA).
 * @undefined {string | number | Date | null | undefined} value - Entrada efectiva esperada por el contrato.
 * @undefined {Intl.DateTimeFormatOptions | undefined} options - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export function formatLocalizedDate(
  value: Date | number | string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (value == null) {
    return '—';
  }
  const d = toDate(value);
  if (!d) {
    return '—';
  }
  return d.toLocaleDateString(getResolvedLocale(), {
    ...DEFAULT_DATE_OPTIONS,
    ...options,
  });
}

/**
 * Expone "formatLocalizedDateTime" en smart-economat-frontend (SPA).
 * @undefined {string | number | Date | null | undefined} value - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export function formatLocalizedDateTime(
  value: Date | number | string | null | undefined
): string {
  if (value == null) {
    return '—';
  }
  const d = toDate(value);
  if (!d) {
    return '—';
  }
  return d.toLocaleString(getResolvedLocale(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Expone "formatLocalizedTime" en smart-economat-frontend (SPA).
 * @undefined {string | number | Date | null | undefined} value - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export function formatLocalizedTime(
  value: Date | number | string | null | undefined
): string {
  if (value == null) {
    return '—';
  }
  const d = toDate(value);
  if (!d) {
    return '—';
  }
  return d.toLocaleTimeString(getResolvedLocale(), {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Expone "formatLocalizedCurrencyEUR" en smart-economat-frontend (SPA).
 * @undefined {string | number | null | undefined} value - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export function formatLocalizedCurrencyEUR(
  value?: number | string | null
): string {
  const amount = Number(value ?? 0);
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(getResolvedLocale(), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

/**
 * Expone "formatLocalizedDecimal" en smart-economat-frontend (SPA).
 * @undefined {number} value - Entrada efectiva esperada por el contrato.
 * @undefined {number} minFractionDigits - Entrada efectiva esperada por el contrato.
 * @undefined {number} maxFractionDigits - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export function formatLocalizedDecimal(
  value: number,
  minFractionDigits = 2,
  maxFractionDigits = 2
): string {
  return new Intl.NumberFormat(getResolvedLocale(), {
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}
