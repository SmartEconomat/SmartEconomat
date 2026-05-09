import { PartialType } from '@nestjs/swagger';
import { CreatePreparacionDto } from './create-preparacion.dto';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { PreparacionEstado } from '../enums/preparacion.enums';

/** Clase pública (UpdatePreparacionDto). Paquete: smart-economat-backend (Nest). */
export class UpdatePreparacionDto extends PartialType(CreatePreparacionDto) {
  @IsOptional()
  @IsEnum(PreparacionEstado)
  estado?: PreparacionEstado;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFinalizacion?: string;
}
