import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import {
  CancelPurchaseBatchDto,
  CreatePurchaseBatchDto,
  UpdatePurchaseBatchDto,
} from './create-purchase-batch.dto';
export { PaginationQueryDto as PedidoUsuarioQueryDto } from '../../../common/dto/pagination-query.dto';

export class CreatePedidoUsuarioDto extends CreatePurchaseBatchDto {}

export class UpdatePedidoUsuarioDto extends UpdatePurchaseBatchDto {}

export class CancelPedidoUsuarioDto extends CancelPurchaseBatchDto {}

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
