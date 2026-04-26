import { TransformFnParams } from 'class-transformer/types/interfaces';
import { BadRequestException } from '@nestjs/common';
import { I18nHelper } from '../helpers/i18n.helper';

/**
 * Documentación en español.
 */
export class NormalizeStringPipe {
        /**
     * Documentación en español.
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
