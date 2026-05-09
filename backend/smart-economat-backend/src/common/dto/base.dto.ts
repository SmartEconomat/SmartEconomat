import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../transformers';

/**
 * DTO que define el contrato de datos de base.
 */
export abstract class BaseDto {
  /**
   * Normaliza strings para mantener consistencia.
   */
  /**
   * Expone "normalizeStrings" en smart-economat-backend (Nest).
   * @undefined {void} Datos efectivos después de ejecutar la operación.
   */
  @Transform((params) => TrimStringTransformer.transform(params))
  protected normalizeStrings(): void {}
}
