/** Contrato de tipos público (BaseFilters). Contexto: smart-economat-frontend (SPA). */
export interface BaseFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc' | 'ASC' | 'DESC';
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: unknown;
}

/**
 * Expone "buildQueryParams" en smart-economat-frontend (SPA).
 * @undefined {BaseFilters} filters - Entrada efectiva esperada por el contrato.
 * @undefined {URLSearchParams} Datos efectivos después de ejecutar la operación.
 */
export const buildQueryParams = (filters: BaseFilters): URLSearchParams => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, String(value));
      }
    }
  });

  return params;
};
