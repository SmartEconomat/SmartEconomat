import {
  IsNumber,
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { PedidoProductoDto } from './pedido-producto.dto';

export class CreatePedidoDto {
  @IsOptional()
  @IsNumber()
  costeTotal?: number;

  @IsOptional()
  @IsEnum(EstadoPedido)
  estado?: EstadoPedido;

  @IsOptional()
  @IsDateString()
  fechaEntrega?: string;

  @IsOptional()
  @IsString()
  motivoCancelacion?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PedidoProductoDto)
  pedidoProductos?: PedidoProductoDto[];
}

export class UpdatePedidoDto extends CreatePedidoDto {}
