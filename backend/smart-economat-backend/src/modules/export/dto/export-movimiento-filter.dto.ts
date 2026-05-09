import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoMovimiento } from '../../movimiento/enums/movimiento.enums';

/** Clase pública (ExportMovimientoFilterDto). Paquete: smart-economat-backend (Nest). */
export class ExportMovimientoFilterDto {
  @IsOptional()
  @IsEnum(TipoMovimiento)
  tipo?: TipoMovimiento;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  maxRows?: number = 5000;
}
