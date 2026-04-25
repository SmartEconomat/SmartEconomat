import { TransformFnParams } from 'class-transformer/types/interfaces';
import { BadRequestException } from '@nestjs/common';
import { I18nHelper } from '../helpers/i18n.helper';

/**
 * @description Utility class that produces `class-transformer` `@Transform` callbacks
 * for common string normalisation tasks. Supports trim, uppercase, and lowercase
 * transformations via a single configurable factory method.
 *
 * Designed to be used with the `@Transform` decorator on DTO properties:
 *
 * @example
 * \@Transform(NormalizeStringPipe.transform({ trim: true, lowercase: true }))
 * email: string;
 *
 * \@Transform(NormalizeStringPipe.transform({ trim: true, uppercase: true }))
 * codigo: string;
 */
export class NormalizeStringPipe {
  /**
   * @description Factory that returns a `class-transformer` transform function
   * configured with the supplied normalisation options. The returned function trims
   * and/or changes the case of the input string value. `null` and non-string values
   * are returned as-is without modification.
   * @param options - Normalisation flags.
   * @param options.trim - When `true` (default), leading and trailing whitespace is removed.
   * @param options.uppercase - When `true`, the string is converted to upper case.
   * @param options.lowercase - When `true`, the string is converted to lower case.
   * @returns A transform callback compatible with `class-transformer`'s `@Transform` decorator.
   * @throws {BadRequestException} If both `uppercase` and `lowercase` are set to `true` simultaneously.
   * @example
   * \@Transform(NormalizeStringPipe.transform({ uppercase: true }))
   * sku: string;
   */
  static transform(
    options: {
      trim?: boolean;
      uppercase?: boolean;
      lowercase?: boolean;
    } = {}
  ) {
    return (params: TransformFnParams): string | undefined => {
      const { trim = true, uppercase = false, lowercase = false } = options;
      let value = params.value as string;

      if (value == null) return value;
      if (typeof value !== 'string') return value;

      if (trim) {
        value = value.trim();
      }

      if (uppercase && lowercase) {
        throw new BadRequestException(
          I18nHelper.getError('UPPERCASE_LOWERCASE_CONFLICT')
        );
      }

      if (uppercase) {
        value = value.toUpperCase();
      }

      if (lowercase) {
        value = value.toLowerCase();
      }

      return value;
    };
  }
}
