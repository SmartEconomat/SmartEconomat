import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RecepcionLineDto {
  @ApiProperty({
    description: 'ID del producto del pedido',
    example: 'uuid-string',
  })
  @IsString()
  pedidoProductoId: string;

  @ApiProperty({ description: 'Cantidad recibida', example: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  cantidadRecibida: number;

  @ApiProperty({
    description: 'Observaciones de la línea',
    required: false,
    example: 'Sin daños',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class CreateRecepcionDto {
  @ApiProperty({ description: 'ID del pedido', example: 'uuid-string' })
  @IsString()
  pedidoId: string;

  @ApiProperty({
    description: 'Número de albarán',
    required: false,
    example: 'ALB-2023-001',
  })
  @IsOptional()
  @IsString()
  nAlbaran?: string;

  @ApiProperty({ description: 'Fecha de recepción', required: false })
  @IsOptional()
  fechaRecepcion?: Date;

  @ApiProperty({ description: 'Observaciones generales', required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({ description: 'Líneas de recepción', type: [RecepcionLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecepcionLineDto)
  lineas: RecepcionLineDto[];

  @ApiProperty({
    description: 'ID del usuario que realiza la operación',
    example: 'uuid-string',
  })
  @IsString()
  usuarioId: string;
}
