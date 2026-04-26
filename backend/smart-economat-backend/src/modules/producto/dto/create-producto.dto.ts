import { i18nValidationMessage } from 'nestjs-i18n';
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
  ArrayUnique,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddProveedorToProductoDto } from './producto-proveedor.dto/add-proveedor-to-producto.dto';
import { TipoProducto, UnidadMedida, Alergeno } from '../enums/producto.enums';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { UppercaseStringTransformer } from '../../../common/transformers/uppercase-string.transformer';
import { StringToDateTransformer } from '../../../common/transformers/string-to-date.transformer';

export class CreateProductoDto {
  @ApiProperty({
    description: 'Nombre genérico del producto maestro.',
    example: 'Leche',
  })
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString({
    message: i18nValidationMessage(
      'validation.EL_NOMBRE_DEBE_SER_UNA_CADENA_DE_TEXTO'
    ),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.EL_NOMBRE_ES_OBLIGATORIO'),
  })
  @MaxLength(100, {
    message: i18nValidationMessage(
      'validation.EL_NOMBRE_NO_PUEDE_EXCEDER_LOS_100_CARAC'
    ),
  })
  nombre: string;

  @ApiPropertyOptional({
    description: 'Marca genérica del producto maestro.',
    example: 'Genérica',
  })
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString({
    message: i18nValidationMessage(
      'validation.LA_MARCA_DEBE_SER_UNA_CADENA_DE_TEXTO'
    ),
  })
  @MaxLength(100, {
    message: i18nValidationMessage(
      'validation.LA_MARCA_NO_PUEDE_EXCEDER_LOS_100_CARACT'
    ),
  })
  marca?: string;

  @ApiPropertyOptional({
    description: 'Descripción técnica o comercial del producto.',
    example: 'Leche entera UHT',
  })
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString({
    message: i18nValidationMessage(
      'validation.LA_DESCRIPCI_N_DEBE_SER_UNA_CADENA_DE_TE'
    ),
  })
  @MaxLength(1000, {
    message: i18nValidationMessage(
      'validation.LA_DESCRIPCI_N_NO_PUEDE_EXCEDER_LOS_1000'
    ),
  })
  descripcion?: string;

  @ApiProperty({
    description: 'Unidad de medida base del producto.',
    enum: UnidadMedida,
    example: UnidadMedida.L,
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.LA_UNIDAD_DEL_PRODUCTO_ES_OBL'),
  })
  @IsEnum(UnidadMedida, {
    message: i18nValidationMessage(
      'validation.LA_UNIDAD_DEL_PRODUCTO_NO_ES_V_LIDA'
    ),
  })
  unidad!: UnidadMedida;

  @ApiPropertyOptional({
    description: 'Fecha de caducidad de referencia.',
    example: '2026-12-31T00:00:00.000Z',
  })
  @IsOptional()
  @Transform((params) => StringToDateTransformer.transform(params))
  @Type(() => Date)
  @IsDate({
    message: i18nValidationMessage(
      'validation.LA_FECHA_DE_CADUCIDAD_DEBE_SER_UNA_FECHA'
    ),
  })
  fechaCaducidad?: Date;

  @ApiPropertyOptional({
    description: 'Ruta o URL de la imagen del producto.',
    example: '/uploads/productos/leche.png',
  })
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString({
    message: i18nValidationMessage(
      'validation.LA_RUTA_DE_LA_IMAGEN_DEBE_SER_UNA_CADENA'
    ),
  })
  @MaxLength(200, {
    message: i18nValidationMessage(
      'validation.LA_RUTA_DE_LA_IMAGEN_NO_PUEDE_EXCEDER_LO'
    ),
  })
  pathImg?: string;

  @ApiPropertyOptional({
    description: 'Tipo o categoría funcional del producto.',
    enum: TipoProducto,
    example: TipoProducto.LACTEO,
  })
  @IsOptional()
  @IsEnum(TipoProducto, {
    message: i18nValidationMessage(
      'validation.EL_TIPO_DE_PRODUCTO_NO_ES_V_LIDO'
    ),
  })
  tipo?: TipoProducto;

  @ApiPropertyOptional({
    description: 'Código de barras o referencia interna del producto maestro.',
    example: 'QAPNEBB8UX',
  })
  @IsOptional()
  @Transform((params) => UppercaseStringTransformer.transform(params))
  @IsString({
    message: i18nValidationMessage(
      'validation.EL_C_DIGO_DE_BARRAS_DEBE_SER_UNA_CADENA'
    ),
  })
  @MaxLength(130, {
    message: i18nValidationMessage(
      'validation.EL_C_DIGO_DE_BARRAS_NO_PUEDE_EXCEDER_LOS'
    ),
  })
  codigoBarras?: string;

  @ApiProperty({
    description: 'Contenido numérico asociado a la unidad.',
    example: 1,
    minimum: 0,
  })
  @IsNumber(
    {},
    {
      message: i18nValidationMessage(
        'validation.EL_CONTENIDO_DEBE_SER_UN_N_MERO'
      ),
    }
  )
  @Min(0, {
    message: i18nValidationMessage(
      'validation.EL_CONTENIDO_NO_PUEDE_SER_NEGATIVO'
    ),
  })
  contenido!: number;

  @ApiPropertyOptional({
    description: 'Listado de alérgenos a registrar en la misma operación.',
    enum: Alergeno,
    isArray: true,
    example: [Alergeno.LACTEOS],
  })
  @IsOptional()
  @IsArray({
    message: i18nValidationMessage(
      'validation.LOS_AL_RGENOS_DEBEN_SER_UN_ARRAY'
    ),
  })
  @ArrayUnique({
    message: i18nValidationMessage('validation.NO_SE_PUEDEN_REPETIR_ALERGENOS'),
  })
  @IsEnum(Alergeno, {
    each: true,
    message: i18nValidationMessage('validation.AL_RGENO_NO_V_LIDO'),
  })
  alergenos?: Alergeno[];

  @ApiPropertyOptional({
    description: 'Proveedores a vincular al producto en la misma transacción.',
    type: () => [AddProveedorToProductoDto],
  })
  @IsOptional()
  @IsArray({
    message: i18nValidationMessage(
      'validation.LOS_PROVEEDORES_DEBEN_SER_UN_ARRAY'
    ),
  })
  @ArrayUnique(
    (proveedor: AddProveedorToProductoDto) => proveedor.proveedorId,
    {
      message: i18nValidationMessage(
        'validation.NO_SE_PUEDE_VINCULAR_EL_MISMO_PROVEEDOR'
      ),
    }
  )
  @ValidateNested({ each: true })
  @Type(() => AddProveedorToProductoDto)
  proveedores?: AddProveedorToProductoDto[];
}
