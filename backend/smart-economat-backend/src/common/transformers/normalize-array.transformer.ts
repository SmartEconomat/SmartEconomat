/**
 * NormalizeArrayTransformer
 *
 * Transformador para normalizar arrays:
 * - Convierte strings separados por comas a arrays
 * - Elimina elementos null/undefined
 * - Aplica trim a strings dentro del array
 * - Maneja valores null/undefined de forma segura
 *
 * @example
 *
 * @Transform(NormalizeArrayTransformer.transform)
 * tags: string[];
 */
export class NormalizeArrayTransformer {
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
