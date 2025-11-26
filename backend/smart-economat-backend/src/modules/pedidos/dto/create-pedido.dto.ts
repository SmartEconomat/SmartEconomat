import {
  IsDateString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { CreatePedidoProductoDto } from './create-pedido-producto.dto';

export class CreatePedidoDto {
  @IsUUID()
  usuarioId: string;

  @IsDateString()
  @IsOptional()
  fecha_entrega?: Date;

  @IsNumber()
  coste_total: number;

  @IsEnum(EstadoPedido)
  @IsOptional()
  estado?: EstadoPedido;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePedidoProductoDto)
  pedidoProductos: CreatePedidoProductoDto[];
}
