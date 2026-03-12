import { TransformFnParams } from 'class-transformer/types/interfaces';

/**
 * StringToDateTransformer
 * 
 * Transformador para convertir strings a objetos Date.
 * Soporta múltiples formatos: ISO 8601, timestamps, fechas en string.
 * Maneja valores null/undefined de forma segura.
 * 
 * @example
 * 
 * @Transform(StringToDateTransformer.transform)
 * fechaCaducidad: Date;
 */
export class StringToDateTransformer {
  static transform(params: TransformFnParams): Date | undefined {
    const value = params.value;
    if (value == null) return value;
    
    // Si ya es Date, retornarlo
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? undefined : value;
    }
    
    // Si es número (timestamp), convertir
    if (typeof value === 'number') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error(`El timestamp '${value}' no es una fecha válida`);
      }
      return date;
    }
    
    // Si es string, intentar convertir
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return undefined;
      
      const date = new Date(trimmed);
      if (isNaN(date.getTime())) {
        throw new Error(`El valor '${value}' no puede ser convertido a fecha`);
      }
      return date;
    }
    
    return value;
  }
}
