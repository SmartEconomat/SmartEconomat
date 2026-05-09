import { BadRequestException } from '@nestjs/common';

/**
 * Valida que un rango de fechas no supere el máximo de días permitido.
 * @param startDate Fecha de inicio (ISO string o Date)
 * @param endDate Fecha de fin (ISO string o Date)
 * @param maxRangeInDays Rango máximo en días (default: 365)
 * @param moduleName Nombre del módulo para el mensaje de error (opcional)
 */
/**
 * Expone "validateDateRange" en smart-economat-backend (Nest).
 * @undefined {string | Date | undefined} startDate - Entrada efectiva esperada por el contrato.
 * @undefined {string | Date | undefined} endDate - Entrada efectiva esperada por el contrato.
 * @undefined {number} maxRangeInDays - Entrada efectiva esperada por el contrato.
 * @undefined {string | undefined} moduleName - Entrada efectiva esperada por el contrato.
 * @undefined {void} Datos efectivos después de ejecutar la operación.
 */
export function validateDateRange(
  startDate?: string | Date,
  endDate?: string | Date,
  maxRangeInDays = 365,
  moduleName?: string
): void {
  if (!startDate || !endDate) return;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new BadRequestException('errors.invalidDateFormat');
  }

  if (start > end) {
    throw new BadRequestException('errors.startDateAfterEndDate');
  }

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > maxRangeInDays) {
    throw new BadRequestException({
      key: 'errors.dateRangeExceeded',
      args: { maxDays: maxRangeInDays, module: moduleName },
      message: moduleName
        ? `El rango máximo permitido para ${moduleName} es de ${maxRangeInDays} días.`
        : `El rango máximo permitido es de ${maxRangeInDays} días (1 año). Ajusta las fechas para continuar.`,
    });
  }
}
