import {
  IsNumber,
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  IsArray,
  ValidateNested,
  IsUUID,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { PedidoProductoDto } from './pedido-producto.dto';
import { CreatePedidoProductoDto } from './create-PedidoProducto.dto';

export class CreatePedidoDto {
  @IsOptional()
  @IsUUID('4', { message: 'El ID del usuario debe ser un UUID válido' })
  idUsuario?: string;

  @IsOptional()
  @IsNumber()
  costeTotal?: number;

  @IsOptional()
  @IsEnum(EstadoPedido)
  estado?: EstadoPedido;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de entrega debe ser una fecha válida (ISO 8601)' }
  )
  fechaEntrega?: string;

  @IsOptional()
  @IsString()
  motivoCancelacion?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PedidoProductoDto)
  pedidoProductos?: PedidoProductoDto[];

  @IsOptional()
  @IsArray({ message: 'Debe enviar una lista de productos' })
  @ValidateNested({ each: true })
  @Type(() => CreatePedidoProductoDto)
  productos?: CreatePedidoProductoDto[];
}

export class UpdatePedidoDto extends CreatePedidoDto {}
