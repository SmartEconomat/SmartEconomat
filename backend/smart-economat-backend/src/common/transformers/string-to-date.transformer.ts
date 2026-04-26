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
export class StringToDateTransformer {
        /**
     * Documentación en español.
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
