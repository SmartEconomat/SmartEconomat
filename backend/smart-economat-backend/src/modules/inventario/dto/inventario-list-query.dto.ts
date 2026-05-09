import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const toUuidList = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (Array.isArray(value)) {
    const list = value.filter((v): v is string => typeof v === 'string');
    return list.length ? list : undefined;
  }
  if (typeof value === 'string') {
    const list = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return list.length ? list : undefined;
  }
  return undefined;
};

/** Query de listado de inventario (paginado) con filtros por ubicación y búsqueda. */
export class InventarioListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'UUIDs de ubicación (repetidos en query o separados por comas). Filtra lotes en esas ubicaciones.',
  })
  @IsOptional()
  @Transform(({ value }) => toUuidList(value))
  @IsUUID('all', { each: true })
  ubicacionIds?: string[];

  @ApiPropertyOptional({
    description:
      'Si es true, solo ítems con cantidad actual por debajo del mínimo',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  onlyLowStock?: boolean;
}
