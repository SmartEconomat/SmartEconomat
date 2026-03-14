import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import {
  DificultadReceta,
  TiempoReceta,
} from '../../receta/enums/receta.enums';

export class ExportRecetaFilterDto {
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsEnum(DificultadReceta)
  dificultad?: DificultadReceta;

  @IsOptional()
  @IsEnum(TiempoReceta)
  tiempo?: TiempoReceta;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  maxRows?: number = 5000;
}
