import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AlergenoProducto, TipoProducto } from '../enums/producto.enums';

export class ProductFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean | undefined;
  })
  minStock?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(AlergenoProducto, { each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? (value as string[])
      : typeof value === 'string'
        ? value.split(',')
        : []
  )
  alergenos?: AlergenoProducto[];

  @IsOptional()
  @IsArray()
  @IsEnum(TipoProducto, { each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? (value as string[])
      : typeof value === 'string'
        ? value.split(',')
        : []
  )
  categorias?: TipoProducto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? (value as string[])
      : typeof value === 'string'
        ? value.split(',')
        : []
  )
  marcas?: string[];
}
