import { PartialType } from '@nestjs/mapped-types';
import {
  CreateIncidenciaDto,
  CreateIncidenciaResuelaDto,
} from './create-incidencia.dto';

export class UpdateIncidenciaDto extends PartialType(CreateIncidenciaDto) {}

export class UpdateIncidenciaResuelaDto extends PartialType(
  CreateIncidenciaResuelaDto
) {}
