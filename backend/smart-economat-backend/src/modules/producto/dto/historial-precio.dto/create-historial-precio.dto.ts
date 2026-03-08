import { IsUUID, IsNumber, Min, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHistorialPrecioDto {
  @IsUUID('7', {
    message: 'El ID del producto proveedor debe ser un UUID válido',
  })
  productoProveedorId!: string;

  @IsNumber({}, { message: 'El precio debe ser un número válido' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  precio!: number;

  @IsOptional()
  @IsDate({ message: 'La fecha debe ser una fecha válida' })
  @Type(() => Date)
  fecha?: Date;
}
