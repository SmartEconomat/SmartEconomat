import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../transformers';

/**
 * Documentación en español.
 */
export abstract class BaseDto {
        /**
     * Documentación en español.
     */
  @Transform((params) => TrimStringTransformer.transform(params))
  protected normalizeStrings(): void {}
}
