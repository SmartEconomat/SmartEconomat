import {
  IsOptional,
  IsEnum,
  IsString,
  IsInt,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { DificultadReceta } from '../../receta/enums/receta.enums';

/** Clase pública (ExportRecetaFilterDto). Paquete: smart-economat-backend (Nest). */
export class ExportRecetaFilterDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? (value as string[])
      : typeof value === 'string'
        ? value.split(',').filter((id) => id.trim().length > 0)
        : []
  )
  ids?: string[];

  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsEnum(DificultadReceta)
  dificultad?: DificultadReceta;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minTiempoMinutos?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxTiempoMinutos?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  maxRows?: number = 5000;
}
