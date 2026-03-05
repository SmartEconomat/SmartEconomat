import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  Min,
  IsDate,
  IsArray,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddProveedorToProductoDto } from './producto-proveedor.dto/add-proveedor-to-producto.dto';
import { TipoProducto, UnidadMedida, Alergeno } from '../enums/producto.enums';

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
  @IsEnum(UnidadMedida, { message: 'La unidad del producto no es válida' })
  unidad?: UnidadMedida;

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
  @MaxLength(13, {
    message: 'El código de barras no puede exceder los 13 caracteres',
  })
  @Matches(/^\d{13}$/, {
    message: 'El código de barras debe ser un EAN-13 de 13 dígitos',
  })
  codigoBarras?: string;

  @IsNumber({}, { message: 'El contenido debe ser un número' })
  @Min(0, { message: 'El contenido no puede ser negativo' })
  contenido!: number;

  @IsOptional()
  @IsArray({ message: 'Los alérgenos deben ser un array' })
  @IsEnum(Alergeno, { each: true, message: 'Alérgeno no válido' })
  alergenos?: Alergeno[];

  @IsOptional()
  @IsArray({ message: 'Los proveedores deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => AddProveedorToProductoDto)
  proveedores?: AddProveedorToProductoDto[];
}
