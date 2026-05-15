import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import {
  CancelPurchaseBatchDto,
  UpdatePurchaseBatchDto,
} from './create-purchase-batch.dto';
import { CreatePedidoLineDto } from './create-pedido-line.dto';
export { PaginationQueryDto as PedidoUsuarioQueryDto } from '../../../common/dto/pagination-query.dto';

/**
 * DTO de creación de pedido de usuario (solicitud interna).
 * Contrato independiente de `CreatePurchaseBatchDto` para evitar acoplamiento de dominio.
 */
export class CreatePedidoUsuarioDto {
  @ApiProperty({
    description: 'Líneas de producto (uno o varios proveedores)',
    type: [CreatePedidoLineDto],
    required: true,
  })
  @IsArray()
  @ArrayNotEmpty({
    message: i18nValidationMessage(
      'validation.E_PEDIDO_DEBE_CONTENER_AL_MENOS_UNA_LINEA'
    ),
  })
  @ValidateNested({ each: true })
  @Type(() => CreatePedidoLineDto)
  lineas!: CreatePedidoLineDto[];

  @ApiPropertyOptional({
    description: 'Observaciones del pedido de usuario',
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

/** Clase pública (UpdatePedidoUsuarioDto). Paquete: smart-economat-backend (Nest). */
export class UpdatePedidoUsuarioDto extends UpdatePurchaseBatchDto {}

/** Clase pública (CancelPedidoUsuarioDto). Paquete: smart-economat-backend (Nest). */
export class CancelPedidoUsuarioDto extends CancelPurchaseBatchDto {}

/** Query PDF pedido de usuario (mismos flags que recepción PDF). */
export class PedidoUsuarioPdfDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === '1') return true;
    return false;
  })
  incluirCancelados?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === '1') return true;
    return false;
  })
  paginaPorProveedor?: boolean;
}
