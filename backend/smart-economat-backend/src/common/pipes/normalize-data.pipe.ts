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
 * @description Global NestJS pipe for automatic normalisation of incoming request data.
 *
 * This pipe runs BEFORE class-validator validation and performs the following steps:
 * 1. Trims all string values (including nested ones).
 * 2. Converts types (string → number, boolean, Date) via `class-transformer`.
 * 3. Recursively normalises arrays and nested objects.
 * 4. Validates the transformed data via `class-validator` and throws a
 *    `BadRequestException` with a translated message on failure.
 *
 * Custom param decorators (`metadata.type === 'custom'`) and primitives are passed
 * through unchanged.
 *
 * @example
 * \@Post()
 * create(\@Body(NormalizeDataPipe) dto: CreateUsuarioDto) {
 *   return this.service.create(dto);
 * }
 */
@Injectable()
export class NormalizeDataPipe implements PipeTransform<unknown> {
  /**
   * @description Transforms and validates the incoming pipeline value. Bypasses
   * normalisation for custom param types and primitives. When a DTO metatype is
   * available it uses `plainToInstance` + `validate` for type coercion and constraint
   * checking. Falls back to recursive object normalisation for plain objects and arrays.
   * @param value - The raw value injected by NestJS (body, query, param, etc.).
   * @param metadata - Argument metadata describing the parameter type and metatype.
   * @returns The normalised (and validated) value.
   * @throws {BadRequestException} If class-validator reports constraint violations on the transformed DTO.
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
   * @description Recursively normalises a plain object or array. For each string
   * value (including object keys) a `trim()` is applied. Nested objects and arrays
   * are processed recursively. Non-string, non-object primitives are left unchanged.
   * @param obj - The object or array to normalise.
   * @returns The normalised object, array, or primitive value.
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
