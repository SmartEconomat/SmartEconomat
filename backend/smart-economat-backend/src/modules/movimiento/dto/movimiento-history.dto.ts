import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsString,
} from 'class-validator';
import { TipoMovimiento } from '../enums/movimiento.enums';

/**
 * DTO para consultar el historial de movimientos de un producto o usuario.
 * Soporta búsqueda por:
 * - Producto: via entityId (ID del ProductoProveedor)
 * - Usuario: via userId (ID del Usuario)
 * - Filtrado por tipo de movimiento y rango de fechas
 */
export class MovimientoHistoryDto {
  @IsUUID('7', { message: 'El ID de la entidad debe ser un UUID válido' })
  @IsOptional()
  entityId?: string;

  @IsUUID('7', { message: 'El ID del usuario debe ser un UUID válido' })
  @IsOptional()
  userId?: string;

  @IsOptional()
  @IsEnum(TipoMovimiento, {
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

  @IsOptional()
  @IsString({ message: 'El sorteo debe ser una cadena válida' })
  sortBy?: 'createdAt' | 'cantidad';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'], {
    message: 'El orden debe ser ASC o DESC',
  })
  sortOrder?: 'ASC' | 'DESC';
}
