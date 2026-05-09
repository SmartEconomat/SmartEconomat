import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsIn,
  IsObject,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { firstNonEmptyString } from './transform-query.helpers';

/**
 * DTO base para todas las consultas que requieren paginación, ordenación y filtrado.
 */
export class BaseQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @Transform(({ value }) => {
    const raw = firstNonEmptyString(value);
    return raw === undefined ? undefined : raw.toUpperCase();
  })
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @IsOptional()
  @Transform(({ value }) => {
    const raw = firstNonEmptyString(value);
    return raw === undefined ? undefined : raw.toUpperCase();
  })
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'ASC';

  /**
   * Filtros dinámicos. Se espera un objeto donde la llave es el campo y el valor es el término de búsqueda.
   * Dependiendo de cómo se envíe desde el frontend (URLSearchParams), puede necesitar transformación.
   */
  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  searchTerm?: string;
}
