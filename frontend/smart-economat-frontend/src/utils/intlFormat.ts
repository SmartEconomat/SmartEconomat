import i18n from '../i18n';

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
