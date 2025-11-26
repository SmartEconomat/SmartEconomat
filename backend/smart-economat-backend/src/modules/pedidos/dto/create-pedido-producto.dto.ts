import { IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreatePedidoProductoDto {
  @IsUUID()
  productoProveedorId: string;

  @IsNumber()
  cantidad: number;

  @IsNumber()
  precio_unitario: number;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
