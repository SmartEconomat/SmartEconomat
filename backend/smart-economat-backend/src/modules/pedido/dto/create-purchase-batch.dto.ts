import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CreatePedidoLineDto } from './create-pedido-line.dto';

export class CreatePurchaseBatchDto {
  @ApiProperty({
    description:
      'Lista de todas las líneas de producto de múltiples proveedores',
    type: [CreatePedidoLineDto],
    required: true,
  })
  @IsArray()
  @ArrayNotEmpty({
    message: i18nValidationMessage(
      'validation.EL_LOTE_DEBE_CONTENER_AL_MENOS_UNA_LINEA'
    ),
  })
  @ValidateNested({ each: true })
  @Type(() => CreatePedidoLineDto)
  lineas!: CreatePedidoLineDto[];

  @ApiPropertyOptional({
    description: 'Observaciones generales para el lote de pedidos',
    required: false,
  })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'ID de la ubicación donde se sugiere entregar el pedido',
    required: false,
  })
  @IsOptional()
  @IsUUID('7')
  ubicacionEntregaSugeridaId?: string;
}

export class ConsolidatePurchaseBatchDto {
  @ApiProperty({
    description: 'IDs de pedidos pendientes que se consolidarán en un lote',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty({
    message: i18nValidationMessage(
      'validation.DEBES_SELECCIONAR_AL_MENOS_UN_PEDIDO'
    ),
  })
  @IsUUID('7', { each: true })
  @Type(() => String)
  pedidoIds!: string[];

  @ApiPropertyOptional({
    description:
      'IDs de pedidos de usuario pendientes que se consolidarán en un lote de compra',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('7', { each: true })
  @Type(() => String)
  pedidoUsuarioIds?: string[];

  @ApiPropertyOptional({
    description: 'Observaciones generales para el lote consolidado',
    required: false,
  })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'ID de la ubicación donde se sugiere entregar el pedido',
    required: false,
  })
  @IsOptional()
  @IsUUID('7')
  ubicacionEntregaSugeridaId?: string;
}

export class UpdatePurchaseBatchDto extends CreatePurchaseBatchDto {}

export class CancelPurchaseBatchDto {
  @ApiPropertyOptional({
    description: 'Motivo de cancelación para todo el pedido',
    required: false,
  })
  @IsOptional()
  @IsString()
  motivoCancelacion?: string;
}
