/**
 * @module UppercaseStringTransformer
 * class-transformer compatible transformer that converts string values to uppercase.
 * Applies `trim()` before uppercasing. Handles `null` and `undefined` gracefully.
 */

import { TransformFnParams } from 'class-transformer/types/interfaces';

/** Subset of `TransformFnParams` that this transformer requires. */
type TransformValueParams = Pick<TransformFnParams, 'value'>;

/**
 * Transformer that converts a string to uppercase after trimming whitespace.
 *
 * Use with the `@Transform` decorator from `class-transformer`:
 *
 * @example
 * import { Transform } from 'class-transformer';
 * import { UppercaseStringTransformer } from '../transformers';
 *
 * export class CreateProductoDto {
 *   \@Transform(UppercaseStringTransformer.transform)
 *   codigo: string;
 * }
 */
export class UppercaseStringTransformer {
  /**
   * Transforms a value to a trimmed, uppercase string.
   *
   * @param {TransformValueParams} params - Transform parameters provided by `class-transformer`.
   * @returns {string | undefined} The uppercased string, or the original value if it is
   *   `null`, `undefined`, or not a string.
   */
  static transform(params: TransformValueParams): string | undefined {
    const value = params.value as string;
    if (value == null) return value;
    if (typeof value !== 'string') return value;
    return value.trim().toUpperCase();
  }
}
