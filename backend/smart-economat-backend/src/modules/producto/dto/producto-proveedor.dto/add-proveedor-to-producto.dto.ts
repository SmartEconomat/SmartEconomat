import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class AddProveedorToProductoDto {
  @IsString({ message: 'El id del proveedor debe ser una cadena' })
  @IsNotEmpty({ message: 'El id del proveedor es obligatorio' })
  proveedorId: string;

  @IsOptional()
  @IsString({ message: 'La marca debe ser una cadena de texto' })
  marcaEspecifica?: string;

  @IsOptional()
  @IsString({ message: 'El código de barras debe ser una cadena de texto' })
  codigoBarras?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El precio unitario debe ser un número' })
  precioUnitario?: number;
}
