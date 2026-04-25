/**
 * @module LowercaseStringTransformer
 * class-transformer compatible transformer that converts string values to lowercase.
 * Applies `trim()` before lowercasing. Handles `null` and `undefined` gracefully.
 */

import { TransformFnParams } from 'class-transformer/types/interfaces';

/** Subset of `TransformFnParams` that this transformer requires. */
type TransformValueParams = Pick<TransformFnParams, 'value'>;

/**
 * Transformer that converts a string to lowercase after trimming whitespace.
 *
 * Use with the `@Transform` decorator from `class-transformer`:
 *
 * @example
 * import { Transform } from 'class-transformer';
 * import { LowercaseStringTransformer } from '../transformers';
 *
 * export class CreateUsuarioDto {
 *   \@Transform(LowercaseStringTransformer.transform)
 *   email: string;
 * }
 */
export class LowercaseStringTransformer {
  /**
   * Transforms a value to a trimmed, lowercase string.
   *
   * @param {TransformValueParams} params - Transform parameters provided by `class-transformer`.
   * @returns {string | undefined} The lowercased string, or the original value if it is
   *   `null`, `undefined`, or not a string.
   */
  static transform(params: TransformValueParams): string | undefined {
    const value = params.value as string;
    if (value == null) return value;
    if (typeof value !== 'string') return value;
    return value.trim().toLowerCase();
  }
}
