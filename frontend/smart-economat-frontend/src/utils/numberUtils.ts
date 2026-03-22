export const parseLocalizedNumber = (
  value: string | number | null | undefined
): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(/\s+/g, '').replace(',', '.');
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
};

export const formatLocalizedNumber = (
  value: number | null | undefined,
  maxFractionDigits: number = 3
): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '0';
  }

  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
};

export const sanitizeLocalizedDecimalInput = (value: string): string =>
  value.replace(/\./g, ',').replace(/[^0-9,]/g, '');
