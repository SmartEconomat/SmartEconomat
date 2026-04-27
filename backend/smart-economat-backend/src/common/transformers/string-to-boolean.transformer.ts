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
export class StringToBooleanTransformer {
  /**
   * Documentación en español.
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
