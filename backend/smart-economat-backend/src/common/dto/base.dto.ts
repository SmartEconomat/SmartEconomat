import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../transformers/trim-string.transformer';

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
   * Aplica trim a todos los campos string de la instancia
   */
  @Transform(TrimStringTransformer.transform)
  protected normalizeStrings(): void {
    // Este método se usa internamente para asegurar consistencia
  }
}
