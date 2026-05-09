import dayjs from 'dayjs';

/**
 * Valida que un rango de fechas no supere el máximo de días permitido.
 * @param startDate Fecha de inicio
 * @param endDate Fecha de fin
 * @param maxDays Rango máximo en días (default: 365)
 * @returns Un objeto con la validez y el mensaje de error si aplica
 */
export const isDateRangeValid = (
  startDate: string | Date | dayjs.Dayjs | null | undefined,
  endDate: string | Date | dayjs.Dayjs | null | undefined,
  maxDays = 365
) => {
  if (!startDate || !endDate) return { isValid: true };

  const start = dayjs(startDate);
  const end = dayjs(endDate);

  if (!start.isValid() || !end.isValid()) {
    return { isValid: false, key: 'dateRange.invalidFormat' };
  }

  if (start.isAfter(end)) {
    return { isValid: false, key: 'dateRange.startAfterEnd' };
  }

  const diff = Math.abs(end.diff(start, 'day'));

  if (diff > maxDays) {
    return {
      isValid: false,
      key: 'dateRange.exceeded',
      args: { maxDays },
    };
  }

  return { isValid: true };
};
