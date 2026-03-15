import {
  IsUUID,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { EstadoProductoRecepcion } from '../enums/estado-producto.enum';

export class CreateRecepcionProductoDto {
  @IsNotEmpty()
  @IsUUID('7')
  idRecepcion!: string;

  @IsNotEmpty()
  @IsUUID('7')
  idPedidoProducto!: string;

  @IsNumber()
  @Min(0)
  cantidadRecibida!: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsEnum(EstadoProductoRecepcion)
  estadoProducto?: EstadoProductoRecepcion;

  @IsOptional()
  @IsDateString()
  fechaRecepcion?: string;
}
