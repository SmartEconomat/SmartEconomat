/**
 * @module StringToNumberTransformer
 * class-transformer compatible transformer that coerces string values to numbers.
 * Supports numeric strings (including comma-as-decimal-separator), native numbers,
 * and returns `null`/`undefined` for missing values.
 */

import { TransformFnParams } from 'class-transformer/types/interfaces';
import { BadRequestException } from '@nestjs/common';
import { I18nHelper } from '../helpers/i18n.helper';

/** Subset of `TransformFnParams` that this transformer requires. */
type TransformValueParams = Pick<TransformFnParams, 'value'>;

/**
 * Transformer that converts a string or numeric value to a JavaScript `number`.
 *
 * Accepts comma as a decimal separator (e.g., `'1,5'` → `1.5`).
 *
 * Use with the `@Transform` decorator from `class-transformer`:
 *
 * @example
 * import { Transform } from 'class-transformer';
 * import { StringToNumberTransformer } from '../transformers';
 *
 * export class CreateInventarioDto {
 *   \@Transform(StringToNumberTransformer.transform)
 *   cantidad: number;
 * }
 */
export class StringToNumberTransformer {
  /**
   * Coerces a value to `number | null | undefined`.
   *
   * @param {TransformValueParams} params - Transform parameters provided by `class-transformer`.
   * @returns {number | null | undefined} The numeric value, `null` if input was `null`,
   *   or `undefined` if input was `undefined` or an empty string.
   * @throws {BadRequestException} If the string value cannot be converted to a finite number.
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
