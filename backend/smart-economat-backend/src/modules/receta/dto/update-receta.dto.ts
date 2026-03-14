import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { CreateRecetaDto } from './create-receta.dto';

export class UpdateRecetaDto extends PartialType(CreateRecetaDto) {
  @Transform((params) => TrimStringTransformer.transform(params))
  nombre?: string;

  @Transform((params) => TrimStringTransformer.transform(params))
  instrucciones?: string;

  @Transform((params) => TrimStringTransformer.transform(params))
  tiempoPreparacion?: string;
}
