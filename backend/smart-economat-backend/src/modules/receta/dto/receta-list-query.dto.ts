import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/** Clase pública (RecetaListQueryDto). Paquete: smart-economat-backend (Nest). */
export class RecetaListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  minTiempoMinutos?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  maxTiempoMinutos?: number;
}
