import { TransformFnParams } from 'class-transformer/types/interfaces';

/**
 * NormalizeStringPipe
 *
 * Pipe especializado para normalización de strings con opciones configurables.
 *
 * Opciones:
 * - trim: Elimina espacios al inicio y final (default: true)
 * - uppercase: Convierte a mayúsculas (default: false)
 * - lowercase: Convierte a minúsculas (default: false)
 *
 * @example
 *
 * @Transform(NormalizeStringPipe.transform({ trim: true, lowercase: true }))
 * email: string;
 *
 * @Transform(NormalizeStringPipe.transform({ trim: true, uppercase: true }))
 * codigo: string;
 */
export class NormalizeStringPipe {
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
        throw new Error(
          'No se pueden activar uppercase y lowercase al mismo tiempo'
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
