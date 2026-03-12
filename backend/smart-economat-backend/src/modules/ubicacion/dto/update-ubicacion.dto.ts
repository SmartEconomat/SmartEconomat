import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { CreateUbicacionDto } from './create-ubicacion.dto';

export class UpdateUbicacionDto extends PartialType(CreateUbicacionDto) {
  @Transform(TrimStringTransformer.transform)
  nombre?: string;

  @Transform(TrimStringTransformer.transform)
  descripcion?: string;
}
