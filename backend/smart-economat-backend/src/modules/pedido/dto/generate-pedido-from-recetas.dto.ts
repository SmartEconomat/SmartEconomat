import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';

/** Clase pública (GeneratePedidoFromRecetasDto). Paquete: smart-economat-backend (Nest). */
export class GeneratePedidoFromRecetasDto {
  @ApiProperty({
    description:
      'IDs de las recetas cuyas necesidades se convertirán en líneas de compra',
    type: [String],
    format: 'uuid',
  })
  @IsArray()
  @ArrayNotEmpty({
    message: i18nValidationMessage(
      'validation.DEVE_ENVIARSE_AL_MENOS_UNA_RECETA'
    ),
  })
  @ArrayUnique({
    message: i18nValidationMessage(
      'validation.NO_SE_PERMITEN_RECETAS_DUPLICADAS'
    ),
  })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage(
      'validation.EL_ID_DE_LA_RECETA_DEBE_SER_UN_UUID_V_LIDO'
    ),
  })
  recetaIds!: string[];

  @ApiPropertyOptional({
    description:
      'ID del proveedor cuando se quiere generar un único pedido. Si se omite en una compra agrupada, el backend repartirá las líneas por proveedor.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L'
    ),
  })
  proveedorId?: string;

  @ApiPropertyOptional({
    description: 'Observaciones opcionales sobre el origen del pedido',
  })
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  observaciones?: string;
}
