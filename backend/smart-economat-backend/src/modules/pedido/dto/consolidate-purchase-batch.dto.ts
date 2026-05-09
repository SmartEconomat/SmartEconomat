import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/** Clase pública (ConsolidatePurchaseBatchDto). Paquete: smart-economat-backend (Nest). */
export class ConsolidatePurchaseBatchDto {
  @ApiProperty({
    description:
      'IDs de pedidos de usuario pendientes que se consolidarán en un lote de compra',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty({
    message: i18nValidationMessage(
      'validation.DEBES_SELECCIONAR_AL_MENOS_UN_PEDIDO'
    ),
  })
  @IsUUID('all', { each: true })
  @Type(() => String)
  pedidoUsuarioIds!: string[];

  @ApiPropertyOptional({
    description: 'Observaciones generales para el lote consolidado',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
