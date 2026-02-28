import {
  IsNumber,
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  IsArray,
  ValidateNested,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { PedidoProductoDto } from './pedido-producto.dto';
import { CreatePedidoProductoDto } from './create-PedidoProducto.dto';

export class CreatePedidoDto {
  @IsOptional()
  @IsUUID('all', { message: 'El ID del usuario debe ser un UUID válido' })
  idUsuario?: string;

  @IsNotEmpty()
  @IsUUID('all', { message: 'El ID del proveedor debe ser un UUID válido' })
  proveedorId!: string;

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePedidoProductoDto)
  productos?: CreatePedidoProductoDto[];
}
