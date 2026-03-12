import {
  BadRequestException,
  Injectable,
  PipeTransform,
  ArgumentMetadata,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { I18nHelper } from '../helpers/i18n.helper';

/**
 * NormalizeDataPipe
 * 
 * Pipe global para normalización automática de datos recibidos desde el frontend.
 * 
 * Este pipe se ejecuta ANTES de la validación y realiza:
 * 1. Trim de todos los strings
 * 2. Conversión de tipos (string a number, boolean, Date)
 * 3. Normalización de arrays y objetos anidados
 * 4. Validación de datos transformados
 * 
 * Se utiliza automáticamente en todos los endpoints gracias a la configuración
 * global en main.ts con I18nValidationPipe.
 * 
 * @example
 * 
 * // En un controller:
 * @Post()
 * create(@Body(NormalizeDataPipe) dto: CreateUsuarioDto) {
 *   // Los datos ya están normalizados y validados
 *   return this.service.create(dto);
 * }
 */
@Injectable()
export class NormalizeDataPipe implements PipeTransform<any> {
  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    if (!value || typeof value !== 'object') {
      return value;
    }

    // Si hay un tipo de metadato, usar class-transformer para transformar
    if (metadata.metatype) {
      const transformed = plainToInstance(metadata.metatype, value, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      });

      // Validar después de transformar
      const errors = await validate(transformed);
      
      if (errors.length > 0) {
        const errorMessages = errors
          .flatMap(error => Object.values(error.constraints || {}))
          .join(', ');
        
        throw new BadRequestException(
          I18nHelper.getError('VALIDACION_FALLIDA') + `: ${errorMessages}`
        );
      }

      return transformed;
    }

    // Si no hay metadato de tipo, aplicar normalización manual
    return this.normalizeObject(value);
  }

  /**
   * Normaliza un objeto recursivamente
   */
  private normalizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.normalizeObject(item));
    }

    const normalized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Trim en keys
      const normalizedKey = typeof key === 'string' ? key.trim() : key;
      
      // Normalizar valor recursivamente
      if (typeof value === 'string') {
        normalized[normalizedKey] = value.trim();
      } else if (value != null && typeof value === 'object') {
        normalized[normalizedKey] = this.normalizeObject(value);
      } else {
        normalized[normalizedKey] = value;
      }
    }

    return normalized;
  }
}
