import { IsUUID, IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateProductoProveedorDto {
  @IsUUID()
  productoId!: string;

  @IsNumber()
  proveedorId!: number;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  codigoBarras?: string;

  @IsOptional()
  @IsNumber()
  precioUnitario?: number;
}
