import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ExportProveedorFilterDto {
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  maxRows?: number = 5000;
}
