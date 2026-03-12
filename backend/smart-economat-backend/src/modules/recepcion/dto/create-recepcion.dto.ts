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
  UnidadMedida,
} from '../../producto/enums/producto.enums';

export class ProductoNuevoDto {
  @ApiProperty({
    description: 'docs.INDICA_SI_ESTE_PRODUCTO_DEBE_CREARSE_EN',
    example: true,
  })
  @IsBoolean()
  pendienteCreacion: boolean;

  @ApiProperty({
    description: 'docs.C_DIGO_DE_BARRAS_ESCANEADO',
    example: '8410188003028',
  })
  @IsString()
  codigoBarras: string;

  @ApiProperty({
    description: 'docs.NOMBRE_INTRODUCIDO_POR_EL_OPERARIO',
    example: 'Tomate frito',
  })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({
    description: 'docs.MARCA_OPCIONAL',
    example: 'Orlando',
  })
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiProperty({ description: 'docs.UNIDAD_DE_MEDIDA', enum: UnidadMedida })
  @IsEnum(UnidadMedida)
  unidad: UnidadMedida;

  @ApiProperty({ description: 'docs.TIPO_DE_PRODUCTO', enum: TipoProducto })
  @IsEnum(TipoProducto)
  tipo: TipoProducto;

  @ApiProperty({
    description: 'docs.CONTENIDO_NETO_PESO_VOLUMEN',
    example: 400,
  })
  @IsNumber()
  @Min(0)
  contenido: number;
}

export class RecepcionLineDto {
  @ApiProperty({
    description: 'docs.ID_DE_LA_L_NEA_ORIGINAL_DEL_PEDIDO',
    example: 'uuid-string',
  })
  @IsString()
  @IsOptional()
  pedidoProductoId: string;

  @ApiProperty({
    description: 'docs.CANTIDAD_REALMENTE_RECIBIDA',
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  cantidadRecibida: number;

  @ApiPropertyOptional({
    description: 'docs.CANTIDAD_CONTADA_O_REPORTADA_EN_EL_ALBAR',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cantidadAlbaran?: number;

  @ApiPropertyOptional({
    description: 'docs.ESTADO_EXTERIOR_VISUAL_CON_EL_QUE_LLEGA',
    enum: EstadoVisualProducto,
    example: EstadoVisualProducto.OPTIMO,
  })
  @IsEnum(EstadoVisualProducto)
  @IsOptional()
  estadoVisual?: EstadoVisualProducto;

  @ApiPropertyOptional({
    description: 'docs.FECHA_DE_CADUCIDAD_DEL_LOTE_F_SICO_RECIB',
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

  @ApiPropertyOptional({
    description: 'docs.INDICA_SI_EL_PESO_SE_OBTUVO_DESDE_LA_B_S',
  })
  @IsOptional()
  @IsBoolean()
  isWeighedWithScale?: boolean;
}

export class ProductoNuevoRecepcionDto extends ProductoNuevoDto {
  @ApiProperty({
    description: 'docs.CANTIDAD_REALMENTE_RECIBIDA_DEL_NUEVO_PR',
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  cantidadRecibida: number;

  @ApiPropertyOptional({
    description: 'docs.OBSERVACIONES_DEL_NUEVO_PRODUCTO',
    example: 'Caja abollada',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'docs.INDICA_SI_EL_PESO_SE_OBTUVO_DESDE_LA_B_S',
  })
  @IsOptional()
  @IsBoolean()
  isWeighedWithScale?: boolean;
}

export class PedidoRecepcionDto {
  @ApiProperty({ description: 'docs.ID_DEL_PEDIDO_AL_QUE_PERTENECE_LA_RECEPC' })
  @IsString()
  pedidoId: string;

  @ApiPropertyOptional({
    description: 'docs.N_DE_ALBAR_N_REFERENCIADO_EN_EL_PEDIDO',
  })
  @IsOptional()
  @IsString()
  nAlbaran?: string;

  @ApiPropertyOptional({
    description: 'docs.FIRMA_OBSERVACIONES_GENERALES_PARA_EL_PE',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class CreateRecepcionDto {
  @ApiPropertyOptional({
    description: 'docs.IDS_DE_PEDIDOS_VINCULADOS_A_ESTA_RECEPCI',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pedidoIds?: string[];

  @ApiPropertyOptional({
    description: 'docs.PEDIDOS_CON_SU_ALBAR_N_INDIVIDUAL',
    type: [PedidoRecepcionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PedidoRecepcionDto)
  pedidos?: PedidoRecepcionDto[];

  @ApiPropertyOptional({
    description: 'docs.N_MERO_DE_ALBAR_N_GENERAL_DE_ENTREGA',
    example: 'ALB-2023-001',
  })
  @IsOptional()
  @IsString()
  nAlbaran?: string;

  @ApiPropertyOptional({
    description: 'docs.FECHA_DE_RECEPCI_N_POR_DEFECTO_CURRENT_T',
  })
  @IsOptional()
  fechaRecepcion?: Date;

  @ApiPropertyOptional({
    description: 'docs.OBSERVACIONES_GENERALES_O_FIRMA_DE_RECEP',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({
    description: 'docs.L_NEAS_VINCULADAS_A_PEDIDOS',
    type: [RecepcionLineDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecepcionLineDto)
  productos: RecepcionLineDto[];

  @ApiPropertyOptional({
    description: 'docs.PRODUCTOS_NUEVOS_A_CREAR_EN_LA_MISMA_TRA',
    type: [ProductoNuevoRecepcionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductoNuevoRecepcionDto)
  productosNuevos?: ProductoNuevoRecepcionDto[];

  @ApiProperty({
    description: 'docs.ID_DEL_USUARIO_OPERARIO_USUALMENTE_SACAD',
    example: 'uuid-string',
  })
  @IsOptional()
  @IsString()
  usuarioId?: string;
}
