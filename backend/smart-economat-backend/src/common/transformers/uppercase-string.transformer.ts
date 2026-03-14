import { TransformFnParams } from 'class-transformer/types/interfaces';

type TransformValueParams = Pick<TransformFnParams, 'value'>;

/**
 * UppercaseStringTransformer
 *
 * Transformador para convertir strings a mayúsculas después de hacer trim.
 * Maneja valores null/undefined de forma segura.
 *
 * @example
 *
 * @Transform(UppercaseStringTransformer.transform)
 * codigo: string;
 */
export class UppercaseStringTransformer {
  static transform(params: TransformValueParams): string | undefined {
    const value = params.value as string;
    if (value == null) return value;
    if (typeof value !== 'string') return value;
    return value.trim().toUpperCase();
  }
}
