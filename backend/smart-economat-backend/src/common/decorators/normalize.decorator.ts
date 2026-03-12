import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../transformers/trim-string.transformer';
import { UppercaseStringTransformer } from '../transformers/uppercase-string.transformer';
import { LowercaseStringTransformer } from '../transformers/lowercase-string.transformer';
import { StringToNumberTransformer } from '../transformers/string-to-number.transformer';
import { StringToBooleanTransformer } from '../transformers/string-to-boolean.transformer';
import { StringToDateTransformer } from '../transformers/string-to-date.transformer';
import { NormalizeArrayTransformer } from '../transformers/normalize-array.transformer';

/**
 * Decoradores de Normalización
 *
 * Facilitan la aplicación de transformaciones comunes en DTOs.
 *
 * @example
 *
 * export class CreateProductoDto {
 *   @NormalizeString()
 *   nombre: string;
 *
 *   @NormalizeString({ uppercase: true })
 *   codigo: string;
 *
 *   @NormalizeString({ lowercase: true })
 *   email: string;
 *
 *   @NormalizeNumber()
 *   precio: number;
 *
 *   @NormalizeBoolean()
 *   activo: boolean;
 *
 *   @NormalizeDate()
 *   fechaCaducidad: Date;
 *
 *   @NormalizeArray()
 *   tags: string[];
 * }
 */

/**
 * Normaliza un string con opciones configurables.
 * Por defecto aplica trim.
 */
export function NormalizeString(options?: {
  trim?: boolean;
  uppercase?: boolean;
  lowercase?: boolean;
}) {
  return Transform((params) => {
    const { trim = true, uppercase = false, lowercase = false } = options || {};
    let value = params.value as string;

    if (value == null) return value;
    if (typeof value !== 'string') return value;

    if (trim) {
      value = value.trim();
    }

    if (uppercase) {
      value = value.toUpperCase();
    }

    if (lowercase) {
      value = value.toLowerCase();
    }

    return value;
  });
}

/**
 * Normaliza un string haciendo trim automático.
 * Alias para NormalizeString({ trim: true }).
 */
export function Trim(): PropertyDecorator {
  return Transform((params) => TrimStringTransformer.transform(params));
}

/**
 * Normaliza un string a mayúsculas con trim.
 */
export function ToUppercase(): PropertyDecorator {
  return Transform((params) => UppercaseStringTransformer.transform(params));
}

/**
 * Normaliza un string a minúsculas con trim.
 */
export function ToLowercase(): PropertyDecorator {
  return Transform((params) => LowercaseStringTransformer.transform(params));
}

/**
 * Normaliza un valor a número.
 * Convierte strings numéricos a números.
 */
export function NormalizeNumber(): PropertyDecorator {
  return Transform((params) => StringToNumberTransformer.transform(params));
}

/**
 * Normaliza un valor a booleano.
 * Soporta múltiples formatos: 'true', 'false', '1', '0', 'yes', 'no'.
 */
export function NormalizeBoolean(): PropertyDecorator {
  return Transform((params) => StringToBooleanTransformer.transform(params));
}

/**
 * Normaliza un valor a Date.
 * Soporta ISO 8601, timestamps, y strings de fecha.
 */
export function NormalizeDate(): PropertyDecorator {
  return Transform((params) => StringToDateTransformer.transform(params));
}

/**
 * Normaliza un array.
 * Convierte strings separados por comas a arrays, aplica trim a elementos.
 */
export function NormalizeArray(): PropertyDecorator {
  return Transform((params) => NormalizeArrayTransformer.transform(params));
}
