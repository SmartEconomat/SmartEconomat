import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TipoMovimiento } from '../enums/movimiento.enums';

export class MovimientoHistoryDto {
  @IsString()
  entityId!: string;

  @IsOptional()
  @IsEnum(TipoMovimiento, { each: true })
  type?: TipoMovimiento;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
