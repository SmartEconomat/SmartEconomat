/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

/**
 * Representa column numeric transformer en el sistema.
 */
export class ColumnNumericTransformer {
  /**
   * Ejecuta la lógica de to dentro del flujo de la aplicación.
   *
   * @param data Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  to(data: number | null | undefined): number {
    return data ?? 0;
  }

  /**
   * Ejecuta la lógica de from dentro del flujo de la aplicación.
   *
   * @param data Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  from(data: string | number | null | undefined): number {
    if (data === null || data === undefined || data === '') {
      return 0;
    }

    const parsed = typeof data === 'number' ? data : parseFloat(data);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
