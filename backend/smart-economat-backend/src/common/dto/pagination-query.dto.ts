import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsInt,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BaseQueryDto } from './base-query.dto';
import { firstNonEmptyString } from './transform-query.helpers';

/**
 * DTO que define el contrato de datos de pagination query.
 */
export class PaginationQueryDto extends BaseQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  declare limit?: number;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @IsOptional()
  @Transform(({ value, obj }: { value: unknown; obj: { search?: unknown } }) =>
    firstNonEmptyString(obj.search, value)
  )
  declare searchTerm?: string;

  @IsOptional()
  search?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @IsOptional()
  codigoBarras?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @IsOptional()
  @IsString()
  rol?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @IsOptional()
  @IsString()
  @Transform(({ value, obj }: { value: unknown; obj: { status?: unknown } }) =>
    firstNonEmptyString(obj.status, value)
  )
  estado?: string;

  @IsOptional()
  @IsString()
  status?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @IsOptional()
  @IsString()
  usuarioId?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @IsOptional()
  @IsDateString()
  @Transform(
    ({ value, obj }: { value: unknown; obj: { dateFrom?: unknown } }) =>
      firstNonEmptyString(obj.dateFrom, value)
  )
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @IsOptional()
  @IsDateString()
  @Transform(({ value, obj }: { value: unknown; obj: { dateTo?: unknown } }) =>
    firstNonEmptyString(obj.dateTo, value)
  )
  fechaHasta?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  sinLote?: boolean;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeDeleted?: boolean;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Alias legacy para mantener compatibilidad temporal.
   */
  @IsOptional()
  @Transform(
    ({ value, obj }: { value: unknown; obj: { sortOrder?: unknown } }) => {
      const raw = firstNonEmptyString(value, obj.sortOrder);
      return raw === undefined ? undefined : raw.toUpperCase();
    }
  )
  @IsIn(['ASC', 'DESC'])
  declare order?: 'ASC' | 'DESC';
}
