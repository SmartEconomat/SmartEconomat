/**
 * Documentación en español.
 */

/**
 * Documentación en español.
 */
export class NormalizeArrayTransformer {
  /**
   * Documentación en español.
   */
  static transform(params: { value: any }): any {
    const value = params.value;
    if (value === null) return null;
    if (value === undefined) return undefined;

    if (Array.isArray(value)) {
      return value
        .filter((item: unknown) => item != null)
        .map((item: unknown) =>
          typeof item === 'string' ? item.trim() : item
        );
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return undefined;
      return trimmed
        .split(',')
        .map((item): string => item.trim())
        .filter((item): item is string => item !== '');
    }

    return [value] as unknown[];
  }
}
