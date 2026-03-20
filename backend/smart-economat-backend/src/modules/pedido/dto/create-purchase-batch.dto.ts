import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreatePedidoLineDto } from './create-pedido-line.dto';

export class CreatePurchaseBatchDto {
  @ApiProperty({
    description:
      'Lista de todas las líneas de producto de múltiples proveedores',
    type: [CreatePedidoLineDto],
    required: true,
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'El lote debe contener al menos una línea' })
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
}
