import {
  IsArray,
  IsBoolean,
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
    description: 'docs.ID_DE_LA_L_NEA_ORIGINAL_DE_PEDIDOPRODUCT',
    example: 'uuid-string',
  })
  @IsString()
  pedidoProductoId: string;

  @ApiProperty({
    description: 'docs.CANTIDAD_CONTADA_Y_RECIBIDA_POR_EL_OPERA',
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  cantidadRecibida: number;

  @ApiPropertyOptional({
    description: 'docs.CANTIDAD_REFLEJADA_EN_EL_ALBAR_N_F_SICO',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cantidadAlbaran?: number;

  @ApiPropertyOptional({
    description: 'docs.INDICA_SI_EL_PESO_FUE_CAPTURADO_POR_B_SC',
  })
  @IsOptional()
  @IsBoolean()
  isWeighedWithScale?: boolean;

  @ApiProperty({
    description: 'docs.ESTADO_EXTERIOR_VISUAL_CON_EL_QUE_LLEGA',
    enum: EstadoVisualProducto,
    example: EstadoVisualProducto.OPTIMO,
  })
  @IsEnum(EstadoVisualProducto)
  estadoVisual: EstadoVisualProducto;

  @ApiPropertyOptional({
    description: 'docs.FECHA_DE_CADUCIDAD_DEL_LOTE_F_SICO_RECIB',
    example: '2026-10-15T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  fechaCaducidad?: Date;

  @ApiPropertyOptional({
    description: 'docs.OBSERVACIONES_EXTRA_PARA_ESTA_L_NEA_EN_C',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class RecepcionMasivaLoteDto {
  @ApiProperty({
    description: 'docs.UUID_DEL_PEDIDO_QUE_SE_EST_RECEPCIONANDO',
  })
  @IsString()
  pedidoId: string;

  @ApiPropertyOptional({
    description: 'docs.FIRMA_U_OBSERVACIONES_GENERALES_DEL_LOTE',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'docs.N_MERO_DE_ALBAR_N_ENTREGADO_POR_EL_TRANS',
  })
  @IsOptional()
  @IsString()
  nAlbaran?: string;

  @ApiProperty({
    description: 'docs.LISTADO_DE_TODOS_LOS_PRODUCTOS_Y_CANTIDA',
    type: [RecepcionMasivaProductoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecepcionMasivaProductoDto)
  productosRecibidos: RecepcionMasivaProductoDto[];
}
