import { I18nHelper } from '../helpers/i18n.helper';
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isUUID } from 'class-validator';

/**
 * Documentación en español.
 */
@Injectable()
export class ParseUUIDv7Pipe implements PipeTransform<string | undefined> {
  /**
   * Documentación en español.
   */
  private static readonly UUID_V7_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  /**
   * Documentación en español.
   */
  transform(value: string | undefined): string {
    if (!value) {
      throw new BadRequestException(
        I18nHelper.getError('UUID_CANNOT_BE_EMPTY')
      );
    }

    if (!isUUID(value, '7')) {
      throw new BadRequestException(
        I18nHelper.getError('INVALID_UUID_V7', { value })
      );
    }

    if (!ParseUUIDv7Pipe.UUID_V7_REGEX.test(value)) {
      throw new BadRequestException(
        I18nHelper.getError('INVALID_UUID_V7_FORMAT', { value })
      );
    }

    return value;
  }
}
