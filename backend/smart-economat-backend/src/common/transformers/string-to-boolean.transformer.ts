/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

import { TransformFnParams } from 'class-transformer/types/interfaces';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
type TransformValueParams = Pick<TransformFnParams, 'value'>;

/**
 * Representa string to boolean transformer en el sistema.
 */
export class StringToBooleanTransformer {
  /**
   * Ejecuta la lógica de transform dentro del flujo de la aplicación.
   *
   * @param params Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
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
