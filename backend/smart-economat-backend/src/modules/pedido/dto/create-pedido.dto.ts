import {
  IsNumber,
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
} from 'class-validator';
import { EstadoPedido } from '../enums/estado-pedido.enum';

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
}

export class UpdatePedidoDto extends CreatePedidoDto {}
