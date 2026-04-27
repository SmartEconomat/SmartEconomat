/**
 * Documentación en español.
 */

/**
 * Documentación en español.
 */
export class PaginatedResponseDto<T> {
  /**
   * Documentación en español.
   */
  data: T[];

  /**
   * Documentación en español.
   */
  total: number;

  /**
   * Documentación en español.
   */
  page: number;

  /**
   * Documentación en español.
   */
  limit: number;

  /**
   * Documentación en español.
   */
  totalPages: number;
}
