import { TransformFnParams } from 'class-transformer/types/interfaces';

/**
 * StringToBooleanTransformer
 * 
 * Transformador para convertir strings/valores a booleanos.
 * Soporta múltiples formatos: 'true', 'false', '1', '0', 'yes', 'no', booleanos directos.
 * Maneja valores null/undefined de forma segura.
 * 
 * @example
 * 
 * @Transform(StringToBooleanTransformer.transform)
 * activo: boolean;
 */
export class StringToBooleanTransformer {
  static transform(params: TransformFnParams): boolean | undefined {
    const value = params.value;
    if (value == null) return value;
    
    // Si ya es booleano, retornarlo
    if (typeof value === 'boolean') return value;
    
    // Si es número, convertir (1 = true, 0 = false)
    if (typeof value === 'number') return value !== 0;
    
    // Si es string, normalizar y convertir
    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase();
      
      if (trimmed === '') return undefined;
      if (['true', '1', 'yes', 'sí', 'si'].includes(trimmed)) return true;
      if (['false', '0', 'no'].includes(trimmed)) return false;
      
      throw new Error(`El valor '${value}' no puede ser convertido a booleano`);
    }
    
    return Boolean(value);
  }
}
