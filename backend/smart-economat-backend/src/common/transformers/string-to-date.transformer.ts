/**
 * @module StringToDateTransformer
 * class-transformer compatible transformer that coerces string or numeric values to `Date` objects.
 * Supports ISO 8601 strings, UNIX timestamps (ms), and native `Date` instances.
 * Handles `null` and `undefined` gracefully.
 */

import { TransformFnParams } from 'class-transformer/types/interfaces';

/** Subset of `TransformFnParams` that this transformer requires. */
type TransformValueParams = Pick<TransformFnParams, 'value'>;

/**
 * Transformer that converts string or numeric values to `Date` objects.
 *
 * Use with the `@Transform` decorator from `class-transformer`:
 *
 * @example
 * import { Transform } from 'class-transformer';
 * import { StringToDateTransformer } from '../transformers';
 *
 * export class CreateInventarioDto {
 *   \@Transform(StringToDateTransformer.transform)
 *   fechaCaducidad: Date;
 * }
 */
export class StringToDateTransformer {
  /**
   * Coerces a value to a `Date` (or `null` / `undefined`).
   *
   * @param {TransformValueParams} params - Transform parameters provided by `class-transformer`.
   * @returns {Date | null | undefined} The parsed `Date`, `null` if the input was `null`,
   *   or `undefined` if the input was `undefined` or an empty string.
   * @throws {Error} If the string or number cannot be parsed into a valid date.
   */
  static transform(params: TransformValueParams): Date | null | undefined {
    const value = params.value;
    if (value === null) return null;
    if (value === undefined) return undefined;

    if (value instanceof Date) {
      return isNaN(value.getTime()) ? undefined : value;
    }

    if (typeof value === 'number') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error(`El timestamp '${value}' no es una fecha válida`);
      }
      return date;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return undefined;

      const date = new Date(trimmed);
      if (isNaN(date.getTime())) {
        throw new Error(`El valor '${value}' no puede ser convertido a fecha`);
      }
      return date;
    }

    return undefined;
  }
}
