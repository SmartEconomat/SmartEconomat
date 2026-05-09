import { TransformFnParams } from 'class-transformer/types/interfaces';
import { BadRequestException } from '@nestjs/common';
import { I18nHelper } from '../helpers/i18n.helper';

/**
 * Utilidad de transformación para decoradores de class-transformer.
 * Permite normalizar strings aplicando recortes (trim) y cambios de caja (mayúsculas/minúsculas).
 */
export class NormalizeStringPipe {
  /**
   * Genera una función de transformación basada en las opciones proporcionadas.
   * @param options Configuración de normalización.
   * @param options.trim Si se deben eliminar espacios en blanco al inicio y final (por defecto true).
   * @param options.uppercase Si se debe convertir a mayúsculas.
   * @param options.lowercase Si se debe convertir a minúsculas.
   * @returns Función compatible con @Transform de class-transformer.
   * @throws BadRequestException Si se activan simultáneamente uppercase y lowercase.
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
