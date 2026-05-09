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
 * Pipe global para la normalización y validación de datos de entrada.
 * Realiza limpieza de espacios en blanco (trim) en strings y transforma objetos planos a instancias de clases.
 */
@Injectable()
export class NormalizeDataPipe implements PipeTransform<unknown> {
  /**
   * Transforma y valida los datos de entrada según los metadatos del argumento.
   * @param value El valor enviado en la petición (body, query, param).
   * @param metadata Metadatos sobre el tipo de dato esperado.
   * @returns El valor normalizado y validado.
   * @throws BadRequestException Si la validación de class-validator falla.
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
   * Recorre recursivamente un objeto o array para limpiar espacios en blanco de sus propiedades de tipo string.
   * @param obj El objeto o array a normalizar.
   * @returns Una copia del objeto con los strings limpios.
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
