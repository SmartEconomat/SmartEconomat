import {
  BadRequestException,
  Injectable,
  PipeTransform,
  ArgumentMetadata,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { I18nHelper } from '../helpers/i18n.helper';

/**
 * Documentación en español.
 */
@Injectable()
export class NormalizeDataPipe implements PipeTransform<unknown> {
        /**
     * Documentación en español.
     */
  async transform(
    value: unknown,
    metadata: ArgumentMetadata
  ): Promise<unknown> {
    if (metadata.type === 'custom') {
      return value;
    }

    if (!value || typeof value !== 'object') {
      return value;
    }

    if (
      !metadata.metatype ||
      metadata.metatype === Object ||
      metadata.metatype === Array
    ) {
      return this.normalizeObject(value);
    }

    if (metadata.metatype) {
      const transformed = plainToInstance(
        metadata.metatype,
        value as Record<string, unknown>,
        {
          enableImplicitConversion: true,

          excludeExtraneousValues: false,
        }
      );

      const errors = await validate(transformed as object);

      if (errors.length > 0) {
        const errorMessages = errors
          .flatMap((error) => Object.values(error.constraints || {}))
          .join(', ');

        throw new BadRequestException(
          I18nHelper.getError('VALIDACION_FALLIDA') + `: ${errorMessages}`
        );
      }

      return transformed;
    }

    return this.normalizeObject(value);
  }

        /**
     * Documentación en español.
     */
  private normalizeObject(obj: object): unknown {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.normalizeObject(item as object));
    }

    const normalized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const normalizedKey = typeof key === 'string' ? key.trim() : key;

      if (typeof value === 'string') {
        normalized[normalizedKey] = value.trim();
      } else if (value != null && typeof value === 'object') {
        normalized[normalizedKey] = this.normalizeObject(value as object);
      } else {
        normalized[normalizedKey] = value;
      }
    }

    return normalized;
  }
}
