import { TransformFnParams } from 'class-transformer/types/interfaces';

/**
 * TrimStringTransformer
 *
 * Transformador para eliminar espacios en blanco al inicio y al final de strings.
 * Maneja valores null/undefined de forma segura.
 *
 * @example
 *
 * @Transform(TrimStringTransformer.transform)
 * nombre: string;
 */
export class TrimStringTransformer {
  static transform(params: TransformFnParams): string | undefined {
    const value = params.value as string;
    if (value == null) return value;
    if (typeof value !== 'string') return value;
    return value.trim();
  }
}
