import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoVisualProducto } from '../enums/estado-visual.enum';

export class RecepcionMasivaProductoDto {
  @ApiProperty({
    description: 'ID de la línea original de PedidoProducto.',
    example: 'uuid-string',
  })
  @IsString()
  pedidoProductoId: string;

  @ApiProperty({
    description: 'Cantidad contada y recibida por el operario.',
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  cantidadRecibida: number;

  @ApiProperty({
    description: 'Estado exterior / visual con el que llega la mercancía',
    enum: EstadoVisualProducto,
    example: EstadoVisualProducto.OPTIMO,
  })
  @IsEnum(EstadoVisualProducto)
  estadoVisual: EstadoVisualProducto;

  @ApiPropertyOptional({
    description: 'Fecha de caducidad del lote físico recibido',
    example: '2026-10-15T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  fechaCaducidad?: Date;

  @ApiPropertyOptional({
    description: 'Observaciones extra para esta línea en concreto',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class RecepcionMasivaLoteDto {
  @ApiProperty({
    description: 'UUID del pedido que se está recepcionando íntegramente',
  })
  @IsString()
  pedidoId: string;

  @ApiPropertyOptional({
    description: 'Firma u observaciones generales del Lote / Albarán',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Número de albarán entregado por el transportista',
  })
  @IsOptional()
  @IsString()
  nAlbaran?: string;

  @ApiProperty({
    description: 'Listado de todos los productos y cantidades contabilizadas',
    type: [RecepcionMasivaProductoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecepcionMasivaProductoDto)
  productosRecibidos: RecepcionMasivaProductoDto[];
}
