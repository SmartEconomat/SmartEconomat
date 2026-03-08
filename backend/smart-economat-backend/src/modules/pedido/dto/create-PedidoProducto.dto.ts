import { IsUUID, IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class CreatePedidoProductoDto {
  @IsUUID('7', {
    message: 'El ID del productoProveedor debe ser un UUID válido',
  })
  idProductoProveedor!: string;

  @IsNumber({}, { message: 'La cantidad debe ser numérica' })
  @Min(0.001, { message: 'La cantidad debe ser mayor que 0' })
  cantidad!: number;

  @IsNumber({}, { message: 'El precio unitario debe ser numérico' })
  @Min(0, { message: 'El precio unitario no puede ser negativo' })
  precioUnitario!: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
