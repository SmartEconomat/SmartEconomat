import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { TipoProducto, UnidadProducto } from '../enums/producto.enums';

export class CreateProductoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsEnum(UnidadProducto)
  unidad?: UnidadProducto;

  @IsOptional()
  @IsDateString()
  caducidad?: Date;

  @IsOptional()
  @IsString()
  pathImg?: string;

  @IsOptional()
  @IsEnum(TipoProducto)
  tipo?: TipoProducto;

  @IsOptional()
  @IsString()
  codigoBarras?: string;

  @IsOptional()
  contenido?: number;
}
