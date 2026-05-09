import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import {
  CancelPurchaseBatchDto,
  CreatePurchaseBatchDto,
  UpdatePurchaseBatchDto,
} from './create-purchase-batch.dto';
export { PaginationQueryDto as PedidoUsuarioQueryDto } from '../../../common/dto/pagination-query.dto';

/** Clase pública (CreatePedidoUsuarioDto). Paquete: smart-economat-backend (Nest). */
export class CreatePedidoUsuarioDto extends CreatePurchaseBatchDto {}

/** Clase pública (UpdatePedidoUsuarioDto). Paquete: smart-economat-backend (Nest). */
export class UpdatePedidoUsuarioDto extends UpdatePurchaseBatchDto {}

/** Clase pública (CancelPedidoUsuarioDto). Paquete: smart-economat-backend (Nest). */
export class CancelPedidoUsuarioDto extends CancelPurchaseBatchDto {}

/** Clase pública (PedidoUsuarioPdfDto). Paquete: smart-economat-backend (Nest). */
export class PedidoUsuarioPdfDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  incluirCancelados?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paginaPorProveedor?: string;
}
