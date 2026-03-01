import {
  IsArray,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsBoolean,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoVisualProducto } from '../enums/estado-visual.enum';
import {
  TipoProducto,
  UnidadProducto,
} from '../../producto/enums/producto.enums';

export class ProductoNuevoDto {
  @ApiProperty({
    description: 'Indica si este producto debe crearse en BD',
    example: true,
  })
  @IsBoolean()
  pendienteCreacion: boolean;

  @ApiProperty({
    description: 'Código de barras escaneado',
    example: '8410188003028',
  })
  @IsString()
  codigoBarras: string;

  @ApiProperty({
    description: 'Nombre introducido por el operario',
    example: 'Tomate frito',
  })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ description: 'Marca opcional', example: 'Orlando' })
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiProperty({ description: 'Unidad de medida', enum: UnidadProducto })
  @IsEnum(UnidadProducto)
  unidad: UnidadProducto;

  @ApiProperty({ description: 'Tipo de producto', enum: TipoProducto })
  @IsEnum(TipoProducto)
  tipo: TipoProducto;

  @ApiProperty({ description: 'Contenido neto (peso/volumen)', example: 400 })
  @IsNumber()
  @Min(0)
  contenido: number;
}

export class RecepcionLineDto {
  @ApiProperty({
    description: 'ID de la línea original del pedido.',
    example: 'uuid-string',
  })
  @IsString()
  @IsOptional()
  pedidoProductoId: string;

  @ApiProperty({
    description: 'Cantidad realmente recibida',
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  cantidadRecibida: number;

  @ApiPropertyOptional({
    description: 'Estado exterior / visual con el que llega la mercancía',
    enum: EstadoVisualProducto,
    example: EstadoVisualProducto.OPTIMO,
  })
  @IsEnum(EstadoVisualProducto)
  @IsOptional()
  estadoVisual?: EstadoVisualProducto;

  @ApiPropertyOptional({
    description: 'Fecha de caducidad del lote físico recibido',
    example: '2026-10-15T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  fechaCaducidad?: Date;

  @ApiPropertyOptional({
    description: 'Observaciones de la línea (e.g. "Caja abollada")',
    example: 'Sin daños',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class ProductoNuevoRecepcionDto extends ProductoNuevoDto {
  @ApiProperty({
    description: 'Cantidad realmente recibida del nuevo producto',
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  cantidadRecibida: number;

  @ApiPropertyOptional({
    description: 'Observaciones del nuevo producto',
    example: 'Caja abollada',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class PedidoRecepcionDto {
  @ApiProperty({ description: 'ID del pedido al que pertenece la recepción' })
  @IsString()
  pedidoId: string;

  @ApiPropertyOptional({
    description: 'Nº de albarán referenciado en el pedido',
  })
  @IsOptional()
  @IsString()
  nAlbaran?: string;

  @ApiPropertyOptional({
    description: 'Firma / Observaciones generales para el pedido',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class CreateRecepcionDto {
  @ApiPropertyOptional({
    description:
      'IDs de pedidos vinculados a esta recepción (opcional por retrocompatibilidad)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pedidoIds?: string[];

  @ApiPropertyOptional({
    description: 'Pedidos con su albarán individual',
    type: [PedidoRecepcionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PedidoRecepcionDto)
  pedidos?: PedidoRecepcionDto[];

  @ApiPropertyOptional({
    description: 'Número de albarán general de entrega',
    example: 'ALB-2023-001',
  })
  @IsOptional()
  @IsString()
  nAlbaran?: string;

  @ApiPropertyOptional({
    description: 'Fecha de recepción. Por defecto current_timestamp',
  })
  @IsOptional()
  fechaRecepcion?: Date;

  @ApiPropertyOptional({
    description: 'Observaciones generales o firma de recepción',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({
    description: 'Líneas vinculadas a pedidos',
    type: [RecepcionLineDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecepcionLineDto)
  productos: RecepcionLineDto[];

  @ApiPropertyOptional({
    description: 'Productos nuevos a crear en la misma transacción',
    type: [ProductoNuevoRecepcionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductoNuevoRecepcionDto)
  productosNuevos?: ProductoNuevoRecepcionDto[];

  @ApiProperty({
    description: 'ID del usuario operario (usualmente sacado del token JWT)',
    example: 'uuid-string',
  })
  @IsOptional()
  @IsString()
  usuarioId?: string;
}
