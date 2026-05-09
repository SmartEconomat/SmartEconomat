/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

/**
 * DTO que define el contrato de datos de paginated response.
 */
export class PaginatedResponseDto<T> {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  data: T[];

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  total: number;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  page: number;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  limit: number;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  totalPages: number;
}
