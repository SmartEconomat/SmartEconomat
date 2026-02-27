import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  Min,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoProducto, UnidadProducto } from '../enums/producto.enums';

export class CreateProductoDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres' })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'La marca debe ser una cadena de texto' })
  @MaxLength(100, { message: 'La marca no puede exceder los 100 caracteres' })
  marca?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MaxLength(1000, {
    message: 'La descripción no puede exceder los 1000 caracteres',
  })
  descripcion?: string;

  @IsOptional()
  @IsEnum(UnidadProducto, { message: 'La unidad del producto no es válida' })
  unidad?: UnidadProducto;

  @IsOptional()
  @Type(() => Date)
  @IsDate({
    message: 'La fecha de caducidad debe ser una fecha válida (ISO 8601)',
  })
  fechaCaducidad?: Date;

  @IsOptional()
  @IsString({ message: 'La ruta de la imagen debe ser una cadena de texto' })
  @MaxLength(200, {
    message: 'La ruta de la imagen no puede exceder los 200 caracteres',
  })
  pathImg?: string;

  @IsOptional()
  @IsEnum(TipoProducto, { message: 'El tipo de producto no es válido' })
  tipo?: TipoProducto;

  @IsOptional()
  @IsString({ message: 'El código de barras debe ser una cadena de texto' })
  @MaxLength(50, {
    message: 'El código de barras no puede exceder los 50 caracteres',
  })
  codigoBarras?: string;

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(0, { message: 'La cantidad no puede ser negativa' })
  contenido?: number;

  @IsOptional()
  @IsString({ each: true })
  alergenos?: string[];

  @IsOptional()
  proveedores?: import('./producto-proveedor.dto/producto-proveedor.dto').ProductoProveedorDto[];
}
