import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../transformers/trim-string.transformer';
import { UppercaseStringTransformer } from '../transformers/uppercase-string.transformer';
import { LowercaseStringTransformer } from '../transformers/lowercase-string.transformer';
import { StringToNumberTransformer } from '../transformers/string-to-number.transformer';
import { StringToBooleanTransformer } from '../transformers/string-to-boolean.transformer';
import { StringToDateTransformer } from '../transformers/string-to-date.transformer';
import { NormalizeArrayTransformer } from '../transformers/normalize-array.transformer';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "NormalizeString" en smart-economat-backend (Nest).
 * @undefined {{ trim?: boolean; uppercase?: boolean; lowercase?: boolean; } | undefined} options - Entrada efectiva esperada por el contrato.
 * @undefined {PropertyDecorator} Datos efectivos después de ejecutar la operación.
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
 * Ejecuta la lógica de trim dentro del flujo de la aplicación.
 * @returns Valor resultante de la operación.
 */
/**
 * Expone "Trim" en smart-economat-backend (Nest).
 * @undefined {PropertyDecorator} Datos efectivos después de ejecutar la operación.
 */
export function Trim(): PropertyDecorator {
  return Transform((params) => TrimStringTransformer.transform(params));
}

/**
 * Ejecuta la lógica de to uppercase dentro del flujo de la aplicación.
 * @returns Valor resultante de la operación.
 */
/**
 * Expone "ToUppercase" en smart-economat-backend (Nest).
 * @undefined {PropertyDecorator} Datos efectivos después de ejecutar la operación.
 */
export function ToUppercase(): PropertyDecorator {
  return Transform((params) => UppercaseStringTransformer.transform(params));
}

/**
 * Ejecuta la lógica de to lowercase dentro del flujo de la aplicación.
 * @returns Valor resultante de la operación.
 */
/**
 * Expone "ToLowercase" en smart-economat-backend (Nest).
 * @undefined {PropertyDecorator} Datos efectivos después de ejecutar la operación.
 */
export function ToLowercase(): PropertyDecorator {
  return Transform((params) => LowercaseStringTransformer.transform(params));
}

/**
 * Normaliza number para mantener consistencia.
 * @returns Valor resultante de la operación.
 */
/**
 * Expone "NormalizeNumber" en smart-economat-backend (Nest).
 * @undefined {PropertyDecorator} Datos efectivos después de ejecutar la operación.
 */
export function NormalizeNumber(): PropertyDecorator {
  return Transform((params) => StringToNumberTransformer.transform(params));
}

/**
 * Normaliza boolean para mantener consistencia.
 * @returns Valor resultante de la operación.
 */
/**
 * Expone "NormalizeBoolean" en smart-economat-backend (Nest).
 * @undefined {PropertyDecorator} Datos efectivos después de ejecutar la operación.
 */
export function NormalizeBoolean(): PropertyDecorator {
  return Transform((params) => StringToBooleanTransformer.transform(params));
}

/**
 * Normaliza date para mantener consistencia.
 * @returns Valor resultante de la operación.
 */
/**
 * Expone "NormalizeDate" en smart-economat-backend (Nest).
 * @undefined {PropertyDecorator} Datos efectivos después de ejecutar la operación.
 */
export function NormalizeDate(): PropertyDecorator {
  return Transform((params) => StringToDateTransformer.transform(params));
}

/**
 * Normaliza array para mantener consistencia.
 * @returns Valor resultante de la operación.
 */
/**
 * Expone "NormalizeArray" en smart-economat-backend (Nest).
 * @undefined {PropertyDecorator} Datos efectivos después de ejecutar la operación.
 */
export function NormalizeArray(): PropertyDecorator {
  return Transform(
    (params) => NormalizeArrayTransformer.transform(params) as unknown[]
  );
}
