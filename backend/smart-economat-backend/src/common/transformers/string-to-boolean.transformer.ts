/**
 * @module StringToBooleanTransformer
 * class-transformer compatible transformer that coerces various value types to a boolean.
 * Supports truthy/falsy string literals, numeric values, and native booleans.
 * Handles `null` and `undefined` gracefully.
 */

import { TransformFnParams } from 'class-transformer/types/interfaces';

/** Subset of `TransformFnParams` that this transformer requires. */
type TransformValueParams = Pick<TransformFnParams, 'value'>;

/**
 * Transformer that coerces string, numeric, or boolean values to a `boolean`.
 *
 * Accepted truthy strings (case-insensitive): `'true'`, `'1'`, `'yes'`, `'sí'`, `'si'`
 * Accepted falsy strings (case-insensitive): `'false'`, `'0'`, `'no'`
 *
 * Use with the `@Transform` decorator from `class-transformer`:
 *
 * @example
 * import { Transform } from 'class-transformer';
 * import { StringToBooleanTransformer } from '../transformers';
 *
 * export class FiltroDto {
 *   \@Transform(StringToBooleanTransformer.transform)
 *   activo: boolean;
 * }
 */
export class StringToBooleanTransformer {
  /**
   * Coerces a value to `boolean | null | undefined`.
   *
   * @param {TransformValueParams} params - Transform parameters provided by `class-transformer`.
   * @returns {boolean | null | undefined} The coerced boolean value.
   *   Returns `null` if the input is `null`.
   *   Returns `undefined` if the input is `undefined` or an empty string.
   * @throws {Error} If the string value cannot be interpreted as a boolean.
   */
  static transform(params: TransformValueParams): boolean | null | undefined {
    const value = params.value;
    if (value === null) return null;
    if (value === undefined) return undefined;

    if (typeof value === 'boolean') return value;

    if (typeof value === 'number') return value !== 0;

    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase();

      if (trimmed === '') return undefined;
      if (['true', '1', 'yes', 'sí', 'si'].includes(trimmed)) return true;
      if (['false', '0', 'no'].includes(trimmed)) return false;

      throw new Error(`El valor '${value}' no puede ser convertido a booleano`);
    }

    return Boolean(value);
  }
}
