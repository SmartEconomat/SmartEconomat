/**
 * @module TrimStringTransformer
 * class-transformer compatible transformer that removes leading and trailing whitespace
 * from string values. Handles `null` and `undefined` gracefully.
 */

import { TransformFnParams } from 'class-transformer/types/interfaces';

/** Subset of `TransformFnParams` that this transformer requires. */
type TransformValueParams = Pick<TransformFnParams, 'value'>;

/**
 * Transformer that strips leading and trailing whitespace from a string value.
 *
 * Use with the `@Transform` decorator from `class-transformer`:
 *
 * @example
 * import { Transform } from 'class-transformer';
 * import { TrimStringTransformer } from '../transformers';
 *
 * export class CreateProductoDto {
 *   \@Transform(TrimStringTransformer.transform)
 *   nombre: string;
 * }
 */
export class TrimStringTransformer {
  /**
   * Trims whitespace from both ends of a string value.
   *
   * @param {TransformValueParams} params - Transform parameters provided by `class-transformer`.
   * @returns {string | undefined} The trimmed string, or the original value if it is
   *   `null`, `undefined`, or not a string.
   */
  static transform(params: TransformValueParams): string | undefined {
    const value = params.value as string;
    if (value == null) return value;
    if (typeof value !== 'string') return value;
    return value.trim();
  }
}
