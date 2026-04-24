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
 * @description Pipe global de NestJS para la normalización automática de los datos de la petición entrante.
 *
 * Este pipe se ejecuta ANTES de la validación de class-validator y realiza los siguientes pasos:
 * 1. Recorta todos los valores de cadena (incluidos los anidados).
 * 2. Convierte tipos (string → number, boolean, Date) mediante `class-transformer`.
 * 3. Normaliza recursivamente arrays y objetos anidados.
 * 4. Valida los datos transformados mediante `class-validator` y lanza una
 *    `BadRequestException` con un mensaje traducido si falla.
 *
 * Los decoradores de parámetro personalizados (`metadata.type === 'custom'`) y los primitivos se pasan
 * sin modificar.
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
   * @description Transforma y valida el valor entrante del pipeline. Omite la normalización
   * para tipos de parámetro personalizados y primitivos. Cuando hay un metatipo DTO disponible,
   * usa `plainToInstance` + `validate` para la conversión de tipos y la comprobación de restricciones.
   * Recurre a la normalización recursiva de objetos para objetos simples y arrays.
   * @param value - El valor bruto inyectado por NestJS (body, query, param, etc.).
   * @param metadata - Metadatos del argumento que describen el tipo y el metatipo del parámetro.
   * @returns El valor normalizado (y validado).
   * @throws {BadRequestException} Si class-validator detecta violaciones de restricciones en el DTO transformado.
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
   * @description Normaliza recursivamente un objeto simple o un array. A cada valor de cadena
   * (incluidas las claves del objeto) se le aplica un `trim()`. Los objetos y arrays anidados
   * se procesan recursivamente. Los primitivos que no son cadenas ni objetos se dejan sin cambios.
   * @param obj - El objeto o array a normalizar.
   * @returns El objeto, array o valor primitivo normalizado.
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
