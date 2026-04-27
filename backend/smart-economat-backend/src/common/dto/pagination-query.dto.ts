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
import { Type } from 'class-transformer';

/**
 * Documentación en español.
 */
export class PaginationQueryDto {
  /**
   * Documentación en español.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * Documentación en español.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  /**
   * Documentación en español.
   */
  @IsOptional()
  searchTerm?: string;

  /**
   * Documentación en español.
   */
  @IsOptional()
  codigoBarras?: string;

  /**
   * Documentación en español.
   */
  @IsOptional()
  @IsString()
  sortBy?: string;

  /**
   * Documentación en español.
   */
  @IsOptional()
  @IsString()
  rol?: string;

  /**
   * Documentación en español.
   */
  @IsOptional()
  @IsString()
  estado?: string;

  /**
   * Documentación en español.
   */
  @IsOptional()
  @IsString()
  usuarioId?: string;

  /**
   * Documentación en español.
   */
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  /**
   * Documentación en español.
   */
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  /**
   * Documentación en español.
   */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  sinLote?: boolean;

  /**
   * Documentación en español.
   */
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'ASC';
}
