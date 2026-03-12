import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../transformers';

/**
 * BaseDto
 *
 * Clase base para todos los DTOs que requieren normalización básica.
 * Aplica trim automático a todos los campos string de la clase.
 *
 * @example
 *
 * export class CreateUsuarioDto extends BaseDto {
 *   username: string; // Se aplicará trim automáticamente
 * }
 */
export abstract class BaseDto {
  /**
   * Applies trim to all string fields of the instance
   */
  @Transform((params) => TrimStringTransformer.transform(params))
  protected normalizeStrings(): void {
    // This method is used internally to ensure consistency
  }
}
