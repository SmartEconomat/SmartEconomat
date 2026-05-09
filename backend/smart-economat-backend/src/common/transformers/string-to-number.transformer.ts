/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

import { TransformFnParams } from 'class-transformer/types/interfaces';
import { BadRequestException } from '@nestjs/common';
import { I18nHelper } from '../helpers/i18n.helper';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
type TransformValueParams = Pick<TransformFnParams, 'value'>;

/**
 * Representa string to number transformer en el sistema.
 */
export class StringToNumberTransformer {
  /**
   * Ejecuta la lógica de transform dentro del flujo de la aplicación.
   *
   * @param params Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  static transform(params: TransformValueParams): number | null | undefined {
    const value = params.value;
    if (value === null) return null;
    if (value === undefined) return undefined;

    if (typeof value === 'number') return value;

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return undefined;

      const normalized = trimmed.replace(/\s+/g, '').replace(',', '.');
      const num = Number(normalized);
      if (isNaN(num)) {
        throw new BadRequestException(
          I18nHelper.getError('CANNOT_CONVERT_TO_NUMBER', { value })
        );
      }
      return num;
    }

    return undefined;
  }
}
