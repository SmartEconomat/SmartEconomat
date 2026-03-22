import { PartialType } from '@nestjs/swagger';
import { CreatePreparacionDto } from './create-preparacion.dto';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { PreparacionEstado } from '../enums/preparacion.enums';

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
