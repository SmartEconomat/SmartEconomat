import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { TipoMovimiento } from '../enums/movimiento.enums';

export class MovimientoHistoryDto {
  @IsUUID('7', { message: 'El ID de la entidad debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de la entidad es obligatorio' })
  entityId!: string;

  @IsOptional()
  @IsEnum(TipoMovimiento, {
    each: true,
    message: 'El tipo de movimiento no es válido',
  })
  type?: TipoMovimiento;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de inicio debe ser una fecha válida (ISO 8601)' }
  )
  startDate?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de fin debe ser una fecha válida (ISO 8601)' }
  )
  endDate?: string;
}
