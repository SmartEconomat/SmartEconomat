import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import {
  CreateIncidenciaDto,
  CreateIncidenciaResuelaDto,
} from './create-incidencia.dto';

/** Clase pública (UpdateIncidenciaDto). Paquete: smart-economat-backend (Nest). */
export class UpdateIncidenciaDto extends PartialType(CreateIncidenciaDto) {
  @Transform((params) => TrimStringTransformer.transform(params))
  observacionesRecepcion?: string;
}

/** Clase pública (UpdateIncidenciaResuelaDto). Paquete: smart-economat-backend (Nest). */
export class UpdateIncidenciaResuelaDto extends PartialType(
  CreateIncidenciaResuelaDto
) {
  @Transform((params) => TrimStringTransformer.transform(params))
  observaciones?: string;
}
