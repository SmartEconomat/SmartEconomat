import {
  IsArray,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsBoolean,
  IsEnum,
  IsNumber,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
/** Clase pública (NotDraftConstraint). Paquete: smart-economat-backend (Nest). */
@ValidatorConstraint({ name: 'notDraft', async: false })
export class NotDraftConstraint implements ValidatorConstraintInterface {
  /**
   * Expone "validate" en smart-economat-backend (Nest).
   * @undefined {any} value - Entrada efectiva esperada por el contrato.
   * @undefined {boolean} Datos efectivos después de ejecutar la operación.
   */
  validate(value: any) {
    return typeof value === 'string' ? value !== 'draft' : true;
  }
  /**
   * Expone "defaultMessage" en smart-economat-backend (Nest).
   * @undefined {string} Datos efectivos después de ejecutar la operación.
   */
  defaultMessage() {
    return `El valor 'draft' no es válido para este campo.`;
  }
}
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoVisualProducto } from '../enums/estado-visual.enum';
import { EstadoProductoRecepcion } from '../enums/estado-producto.enum';
import {
  TipoProducto,
  UnidadMedida,
} from '../../producto/enums/producto.enums';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { StringToDateTransformer } from '../../../common/transformers/string-to-date.transformer';
import { StringToBooleanTransformer } from '../../../common/transformers/string-to-boolean.transformer';

/** Clase pública (ProductoNuevoDto). Paquete: smart-economat-backend (Nest). */
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
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  nombre: string;

  @ApiPropertyOptional({
    description: 'docs.MARCA_OPCIONAL',
    example: 'Orlando',
  })
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
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

/** Clase pública (RecepcionLineDto). Paquete: smart-economat-backend (Nest). */
export class RecepcionLineDto {
  @ApiProperty({
    description: 'docs.ID_DE_LA_L_NEA_ORIGINAL_DEL_PEDIDO',
    example: 'uuid-string',
  })
  @IsString()
  @IsOptional()
  @Validate(NotDraftConstraint)
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
    description:
      'Estado funcional del producto recepcionado para controlar inventario e incidencias',
    enum: EstadoProductoRecepcion,
    example: EstadoProductoRecepcion.PERFECTO,
  })
  @IsOptional()
  @IsEnum(EstadoProductoRecepcion)
  estadoProducto?: EstadoProductoRecepcion;

  @ApiPropertyOptional({
    description: 'docs.FECHA_DE_CADUCIDAD_DEL_LOTE_F_SICO_RECIB',
    example: '2026-10-15T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @Transform((params) => StringToDateTransformer.transform(params))
  fechaCaducidad?: Date;

  @ApiPropertyOptional({
    description: 'Observaciones de la línea (e.g. "Caja abollada")',
    example: 'Sin daños',
  })
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({
    description:
      'Descripción libre para la incidencia automática vinculada a la línea cuando el producto llegue roto',
    example: 'Palé golpeado durante la descarga',
  })
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  incidenciaDescripcion?: string;

  @ApiPropertyOptional({
    description: 'docs.INDICA_SI_EL_PESO_SE_OBTUVO_DESDE_LA_B_S',
  })
  @IsOptional()
  @Transform((params) => StringToBooleanTransformer.transform(params))
  @IsBoolean()
  isWeighedWithScale?: boolean;
}

/** Clase pública (ProductoNuevoRecepcionDto). Paquete: smart-economat-backend (Nest). */
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
    description: 'docs.CANTIDAD_REPORTADA_EN_EL_ALBAR_N_PARA_EL_P',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cantidadAlbaran?: number;

  @ApiPropertyOptional({
    description: 'docs.OBSERVACIONES_DEL_NUEVO_PRODUCTO',
    example: 'Caja abollada',
  })
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'docs.INDICA_SI_EL_PESO_SE_OBTUVO_DESDE_LA_B_S',
  })
  @IsOptional()
  @Transform((params) => StringToBooleanTransformer.transform(params))
  @IsBoolean()
  isWeighedWithScale?: boolean;
}

/** Clase pública (PedidoRecepcionDto). Paquete: smart-economat-backend (Nest). */
export class PedidoRecepcionDto {
  @ApiProperty({ description: 'docs.ID_DEL_PEDIDO_AL_QUE_PERTENECE_LA_RECEPC' })
  @IsString()
  @Validate(NotDraftConstraint)
  pedidoId: string;

  @ApiPropertyOptional({
    description: 'docs.N_DE_ALBAR_N_REFERENCIADO_EN_EL_PEDIDO',
  })
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  nAlbaran?: string;

  @ApiPropertyOptional({
    description: 'docs.FIRMA_OBSERVACIONES_GENERALES_PARA_EL_PE',
  })
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  observaciones?: string;
}

/** Clase pública (CreateRecepcionDto). Paquete: smart-economat-backend (Nest). */
export class CreateRecepcionDto {
  @ApiPropertyOptional({
    description: 'docs.IDS_DE_PEDIDOS_VINCULADOS_A_ESTA_RECEPCI',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Validate(NotDraftConstraint, { each: true })
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
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  nAlbaran?: string;

  @ApiPropertyOptional({
    description: 'docs.FECHA_DE_RECEPCI_N_POR_DEFECTO_CURRENT_T',
  })
  @IsOptional()
  @Type(() => Date)
  @Transform((params) => StringToDateTransformer.transform(params))
  fechaRecepcion?: Date;

  @ApiPropertyOptional({
    description: 'docs.OBSERVACIONES_GENERALES_O_FIRMA_DE_RECEP',
  })
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
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
  @Validate(NotDraftConstraint)
  usuarioId?: string;
}
