import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { CreateUbicacionDto } from './create-ubicacion.dto';

export class UpdateUbicacionDto extends PartialType(CreateUbicacionDto) {
  @Transform(function (this: void, params) {
    return TrimStringTransformer.transform(params);
  })
  nombre?: string;

  @Transform(function (this: void, params) {
    return TrimStringTransformer.transform(params);
  })
  descripcion?: string;
}
