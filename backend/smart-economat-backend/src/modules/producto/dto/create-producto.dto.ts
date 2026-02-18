import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';
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
  @IsDateString(
    {},
    { message: 'La fecha de caducidad debe ser una fecha válida (ISO 8601)' }
  )
  caducidad?: Date;

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

  @IsOptional()
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(0, { message: 'La cantidad no puede ser negativa' })
  cantidad?: number;
}
