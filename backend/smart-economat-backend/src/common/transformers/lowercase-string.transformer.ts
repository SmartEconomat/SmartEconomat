import { TransformFnParams } from 'class-transformer/types/interfaces';

type TransformValueParams = Pick<TransformFnParams, 'value'>;

/**
 * LowercaseStringTransformer
 *
 * Transformador para convertir strings a minúsculas después de hacer trim.
 * Maneja valores null/undefined de forma segura.
 *
 * @example
 *
 * @Transform(LowercaseStringTransformer.transform)
 * email: string;
 */
export class LowercaseStringTransformer {
  static transform(params: TransformValueParams): string | undefined {
    const value = params.value as string;
    if (value == null) return value;
    if (typeof value !== 'string') return value;
    return value.trim().toLowerCase();
  }
}
