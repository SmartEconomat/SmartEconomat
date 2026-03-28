import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { CreatePedidoLineDto } from './create-pedido-line.dto';

export class UpdatePedidoDto {
  @ApiPropertyOptional({
    description: 'ID del proveedor',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('7', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L'
    ),
  })
  proveedorId?: string;

  @ApiPropertyOptional({
    description: 'Observaciones operativas del pedido',
  })
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  @MaxLength(500, {
    message: i18nValidationMessage(
      'validation.LA_OBSERVACI_N_NO_PUEDE_SUPERAR_LOS_500'
    ),
  })
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Líneas de detalle del pedido',
    type: [CreatePedidoLineDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({
    message: i18nValidationMessage(
      'validation.E_PEDIDO_DEBE_CONTENER_AL_MENOS_UNA_LINEA'
    ),
  })
  @ValidateNested({ each: true })
  @Type(() => CreatePedidoLineDto)
  lineas?: CreatePedidoLineDto[];
}
