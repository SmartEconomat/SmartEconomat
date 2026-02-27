import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class PedidoProductoDto {
  @IsString()
  @IsNotEmpty()
  productoProveedorId: string;

  @IsNumber()
  @Min(0.001)
  cantidad: number;

  @IsNumber()
  @Min(0)
  precioUnitario: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
