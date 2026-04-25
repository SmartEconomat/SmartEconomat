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
 * @description DTO that encapsulates all pagination, sorting, and filtering parameters
 * accepted by list endpoints. All fields are optional and carry sensible defaults.
 * Consumers spread this DTO into `buildFindManyOptions` to produce TypeORM query fragments.
 * @example
 * \@Get()
 * findAll(\@Query() query: PaginationQueryDto) {
 *   return this.service.findAll(query);
 * }
 */
export class PaginationQueryDto {
  /** @description 1-based page number to retrieve. Defaults to `1`. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /** @description Maximum number of records per page. Capped at `50`. Defaults to `20`. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  /** @description Free-text search term applied by the service layer (implementation varies per resource). */
  @IsOptional()
  searchTerm?: string;

  /** @description Filter by EAN-13 barcode value. */
  @IsOptional()
  codigoBarras?: string;

  /** @description Name of the field to sort results by. Must match an allowed sortable field for the resource. */
  @IsOptional()
  @IsString()
  sortBy?: string;

  /** @description Filter results by user role name. */
  @IsOptional()
  @IsString()
  rol?: string;

  /** @description Filter results by entity status (e.g. `'activo'`, `'inactivo'`). */
  @IsOptional()
  @IsString()
  estado?: string;

  /** @description Filter results to those associated with the specified user UUID. */
  @IsOptional()
  @IsString()
  usuarioId?: string;

  /** @description ISO 8601 start date for date-range filtering (inclusive). */
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  /** @description ISO 8601 end date for date-range filtering (inclusive). */
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  /** @description When `true`, filters results to inventory entries that have no associated lot. */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  sinLote?: boolean;

  /** @description Sort direction. Accepts `'ASC'` or `'DESC'`. Defaults to `'ASC'`. */
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'ASC';
}
