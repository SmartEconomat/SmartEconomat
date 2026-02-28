import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { TipoProducto } from '../enums/producto.enums';

export class ProductoListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(TipoProducto)
  tipo?: TipoProducto;

  @IsOptional()
  @IsString()
  alergenos?: string;
}
