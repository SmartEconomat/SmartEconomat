/**
 * Documentación en español.
 */

/**
 * Documentación en español.
 */
export class ColumnNumericTransformer {
        /**
     * Documentación en español.
     */
  to(data: number | null | undefined): number {
    return data ?? 0;
  }

        /**
     * Documentación en español.
     */
  from(data: string | number | null | undefined): number {
    if (data === null || data === undefined || data === '') {
      return 0;
    }

    const parsed = typeof data === 'number' ? data : parseFloat(data);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
