import {
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/** Clase pública (ExportIncidenciaFilterDto). Paquete: smart-economat-backend (Nest). */
export class ExportIncidenciaFilterDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean | undefined;
  })
  resuelta?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean | undefined;
  })
  soloNoResueltas?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID('all')
  proveedorId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  maxRows?: number = 5000;
}
