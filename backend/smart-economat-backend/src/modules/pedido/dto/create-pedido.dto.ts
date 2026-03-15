import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsUUID,
  IsNotEmpty,
  ArrayNotEmpty,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CreatePedidoLineDto } from './create-pedido-line.dto';
import { ApiProperty } from '@nestjs/swagger';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';

export class CreatePedidoDto {
  @ApiProperty({
    description: 'ID del proveedor',
    required: true,
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID('7', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L'
    ),
  })
  proveedorId!: string;

  @ApiProperty({
    description: 'Observaciones operativas del pedido',
    required: false,
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

  @ApiProperty({
    description: 'Líneas de detalle del pedido',
    type: [CreatePedidoLineDto],
    required: true,
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'El pedido debe contener al menos una línea' })
  @ValidateNested({ each: true })
  @Type(() => CreatePedidoLineDto)
  lineas!: CreatePedidoLineDto[];
}
