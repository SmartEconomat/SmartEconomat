import {
  IsUUID,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

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
  @IsDateString()
  fechaRecepcion?: string;
}
