/**
 * Documentación en español.
 */

import { TransformFnParams } from 'class-transformer/types/interfaces';

/**
 * Documentación en español.
 */
type TransformValueParams = Pick<TransformFnParams, 'value'>;

/**
 * Documentación en español.
 */
export class TrimStringTransformer {
  /**
   * Documentación en español.
   */
  static transform(params: TransformValueParams): string | undefined {
    const value = params.value as string;
    if (value == null) return value;
    if (typeof value !== 'string') return value;
    return value.trim();
  }
}
