import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../transformers/trim-string.transformer';
import { UppercaseStringTransformer } from '../transformers/uppercase-string.transformer';
import { LowercaseStringTransformer } from '../transformers/lowercase-string.transformer';
import { StringToNumberTransformer } from '../transformers/string-to-number.transformer';
import { StringToBooleanTransformer } from '../transformers/string-to-boolean.transformer';
import { StringToDateTransformer } from '../transformers/string-to-date.transformer';
import { NormalizeArrayTransformer } from '../transformers/normalize-array.transformer';

/**
 * Documentación en español.
 */

/**
 * Documentación en español.
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
 * Documentación en español.
 */
export function Trim(): PropertyDecorator {
  return Transform((params) => TrimStringTransformer.transform(params));
}

/**
 * Documentación en español.
 */
export function ToUppercase(): PropertyDecorator {
  return Transform((params) => UppercaseStringTransformer.transform(params));
}

/**
 * Documentación en español.
 */
export function ToLowercase(): PropertyDecorator {
  return Transform((params) => LowercaseStringTransformer.transform(params));
}

/**
 * Documentación en español.
 */
export function NormalizeNumber(): PropertyDecorator {
  return Transform((params) => StringToNumberTransformer.transform(params));
}

/**
 * Documentación en español.
 */
export function NormalizeBoolean(): PropertyDecorator {
  return Transform((params) => StringToBooleanTransformer.transform(params));
}

/**
 * Documentación en español.
 */
export function NormalizeDate(): PropertyDecorator {
  return Transform((params) => StringToDateTransformer.transform(params));
}

/**
 * Documentación en español.
 */
export function NormalizeArray(): PropertyDecorator {
  return Transform(
    (params) => NormalizeArrayTransformer.transform(params) as unknown[]
  );
}
