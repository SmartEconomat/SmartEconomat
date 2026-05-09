import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductFilterDto } from '../../producto/dto/product-filter.dto';

/** Clase pública (ExportProductoFilterDto). Paquete: smart-economat-backend (Nest). */
export class ExportProductoFilterDto extends ProductFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  maxRows?: number = 5000;
}
