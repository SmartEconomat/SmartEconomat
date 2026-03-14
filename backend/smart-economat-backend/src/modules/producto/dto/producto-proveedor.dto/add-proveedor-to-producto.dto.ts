import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsUUID,
  Matches,
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
  @IsUUID('7', {
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
    description: 'Código de barras EAN-13 específico del proveedor.',
    example: '8410123456789',
  })
  @IsOptional()
  @Transform((params) => UppercaseStringTransformer.transform(params))
  @IsString({
    message: i18nValidationMessage(
      'validation.EL_C_DIGO_DE_BARRAS_DEBE_SER_UNA_CADENA'
    ),
  })
  @MaxLength(13, {
    message: i18nValidationMessage(
      'validation.EL_C_DIGO_DE_BARRAS_NO_PUEDE_EXCEDER_LOS'
    ),
  })
  @Matches(/^\d{13}$/, {
    message: i18nValidationMessage(
      'validation.EL_C_DIGO_DE_BARRAS_DEBE_SER_UN_EAN_13_D'
    ),
  })
  codigoBarras?: string;

  @ApiPropertyOptional({
    description: 'Precio unitario pactado con el proveedor.',
    example: 1.35,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber(
    {},
    {
      message: i18nValidationMessage(
        'validation.EL_PRECIO_UNITARIO_DEBE_SER_UN_N_MERO'
      ),
    }
  )
  @Min(0, {
    message: i18nValidationMessage(
      'validation.EL_PRECIO_UNITARIO_NO_PUEDE_SER_NEGATIV'
    ),
  })
  precioUnitario?: number;
}
