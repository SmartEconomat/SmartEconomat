/**
 * @module NormalizeArrayTransformer
 * class-transformer compatible transformer that normalises array values.
 * Converts comma-separated strings to arrays, removes null/undefined elements,
 * and trims string items. Handles `null` and `undefined` gracefully.
 */

/**
 * Transformer that normalises an array value.
 *
 * Behaviour:
 * - If the input is already an array, filters out `null`/`undefined` items and trims strings.
 * - If the input is a comma-separated string, splits it and trims each element.
 * - If the input is a single non-array, non-string value, wraps it in a one-element array.
 *
 * Use with the `@Transform` decorator from `class-transformer`:
 *
 * @example
 * import { Transform } from 'class-transformer';
 * import { NormalizeArrayTransformer } from '../transformers';
 *
 * export class CreateProductoDto {
 *   \@Transform(NormalizeArrayTransformer.transform)
 *   tags: string[];
 * }
 */
export class NormalizeArrayTransformer {
  /**
   * Normalises the value into a clean array.
   *
   * @param {{ value: any }} params - Transform parameters provided by `class-transformer`.
   *   Only the `value` field is used.
   * @returns {any} A normalised array, `null`, or `undefined` depending on the input.
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
