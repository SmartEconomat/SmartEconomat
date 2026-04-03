import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsDefined,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../../common/transformers/trim-string.transformer';
import { UppercaseStringTransformer } from '../../../../common/transformers/uppercase-string.transformer';

export class AddProveedorToProductoDto {
  @ApiProperty({
    description: 'Identificador UUID v7 del proveedor asociado al producto.',
    example: '01954a85-6215-7f83-8e5c-2b6fd3d6a4b1',
  })
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L'
    ),
  })
  @IsString({
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UNA_CADENA'
    ),
  })
  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PROVEEDOR_ES_OBLIGATORIO'
    ),
  })
  proveedorId: string;

  @ApiPropertyOptional({
    description:
      'Marca concreta con la que el proveedor comercializa el producto.',
    example: 'Pascual',
  })
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.LA_MARCA_ESPECIFICA_NO_PUEDE_ESTAR_VACIA'
    ),
  })
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
  marcaEspecifica?: string;

  @ApiPropertyOptional({
    description: 'Código de barras o referencia específica del proveedor.',
    example: 'PROV-LECHE-001',
  })
  @IsOptional()
  @Transform((params) => UppercaseStringTransformer.transform(params))
  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.EL_CODIGO_DE_BARRAS_NO_PUEDE_ESTAR_VACIO'
    ),
  })
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
    description: 'Precio unitario pactado con el proveedor.',
    example: 1.35,
    minimum: 0.01,
  })
  @IsDefined({
    message: i18nValidationMessage(
      'validation.EL_PRECIO_UNITARIO_ES_OBLIGATORIO'
    ),
  })
  @IsNumber(
    {},
    {
      message: i18nValidationMessage(
        'validation.EL_PRECIO_UNITARIO_DEBE_SER_UN_N_MERO'
      ),
    }
  )
  @Min(0.01, {
    message: i18nValidationMessage(
      'validation.EL_PRECIO_UNITARIO_DEBE_SER_MAYOR_QUE_0'
    ),
  })
  precioUnitario?: number;
}
