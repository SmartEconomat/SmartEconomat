/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

import { TransformFnParams } from 'class-transformer/types/interfaces';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
type TransformValueParams = Pick<TransformFnParams, 'value'>;

/**
 * Representa trim string transformer en el sistema.
 */
export class TrimStringTransformer {
  /**
   * Ejecuta la lógica de transform dentro del flujo de la aplicación.
   *
   * @param params Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  static transform(params: TransformValueParams): string | undefined {
    const value = params.value as string;
    if (value == null) return value;
    if (typeof value !== 'string') return value;
    return value.trim();
  }
}
