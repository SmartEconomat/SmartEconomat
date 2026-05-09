import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoRecepcion } from '../../recepcion/enums/estado-recepcion.enum';

/** Clase pública (ExportRecepcionFilterDto). Paquete: smart-economat-backend (Nest). */
export class ExportRecepcionFilterDto {
  @IsOptional()
  @IsEnum(EstadoRecepcion)
  estado?: EstadoRecepcion;

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
