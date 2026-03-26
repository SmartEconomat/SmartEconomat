import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class ConsolidatePurchaseBatchDto {
  @ApiProperty({
    description: 'IDs de pedidos pendientes que se consolidarán en un lote',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Debes seleccionar al menos un pedido.' })
  @IsUUID('7', { each: true })
  @Type(() => String)
  pedidoIds!: string[];

  @ApiPropertyOptional({
    description:
      'IDs de pedidos de usuario pendientes que se consolidarán en un lote de compra',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('7', { each: true })
  @Type(() => String)
  pedidoUsuarioIds?: string[];

  @ApiPropertyOptional({
    description: 'Observaciones generales para el lote consolidado',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
