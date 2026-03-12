import { TransformFnParams } from 'class-transformer/types/interfaces';

/**
 * StringToNumberTransformer
 *
 * Transformador para convertir strings a números.
 * Soporta múltiples formatos: strings numéricos, números directos.
 * Maneja valores null/undefined de forma segura.
 *
 * @example
 *
 * @Transform(StringToNumberTransformer.transform)
 * cantidad: number;
 */
export class StringToNumberTransformer {
  static transform(params: TransformFnParams): number | null | undefined {
    const value = params.value;
    if (value === null) return null;
    if (value === undefined) return undefined;

    if (typeof value === 'number') return value;

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return undefined;

      const num = Number(trimmed);
      if (isNaN(num)) {
        throw new Error(`El valor '${value}' no puede ser convertido a número`);
      }
      return num;
    }

    return value as number;
  }
}
