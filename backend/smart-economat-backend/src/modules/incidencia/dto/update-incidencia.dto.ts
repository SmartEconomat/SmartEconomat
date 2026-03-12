import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import {
  CreateIncidenciaDto,
  CreateIncidenciaResuelaDto,
} from './create-incidencia.dto';

export class UpdateIncidenciaDto extends PartialType(CreateIncidenciaDto) {
  @Transform(TrimStringTransformer.transform)
  observacionesRecepcion?: string;
}

export class UpdateIncidenciaResuelaDto extends PartialType(
  CreateIncidenciaResuelaDto
) {
  @Transform(TrimStringTransformer.transform)
  observaciones?: string;
}
