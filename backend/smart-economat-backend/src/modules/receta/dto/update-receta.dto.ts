import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { CreateRecetaDto } from './create-receta.dto';

export class UpdateRecetaDto extends PartialType(CreateRecetaDto) {
  @Transform(TrimStringTransformer.transform)
  nombre?: string;

  @Transform(TrimStringTransformer.transform)
  instrucciones?: string;

  @Transform(TrimStringTransformer.transform)
  tiempoPreparacion?: string;
}
