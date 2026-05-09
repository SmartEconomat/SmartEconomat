import { I18nHelper } from '../helpers/i18n.helper';
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isUUID } from 'class-validator';

/**
 * Pipe transformador para validar y convertir strings a UUIDv7.
 * Asegura que el valor proporcionado sea un UUID válido según la especificación RFC 4122 (versión 7).
 */
@Injectable()
export class ParseUUIDv7Pipe implements PipeTransform<string | undefined> {
  /**
   * Expresión regular para validar el formato de UUIDv7.
   * Busca un UUID v7 (versión 7) según el formato RFC 4122.
   */
  private static readonly UUID_V7_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  /**
   * Transforma y valida el valor de entrada asegurando que sea un UUIDv7 válido.
   * Si el valor es inválido o no es un UUIDv7, lanza una excepción.
   * @param value Valor de entrada, esperado como string (puede ser undefined).
   * @returns El valor transformado a string (si es válido).
   * @throws BadRequestException Si el valor está vacío, no es un UUID o no cumple el formato v7.
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
