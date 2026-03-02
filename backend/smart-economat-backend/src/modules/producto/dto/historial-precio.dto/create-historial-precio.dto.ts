import {
  IsUUID,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateHistorialPrecioDto {
  @IsUUID('all', {
    message: 'El ID del producto proveedor debe ser un UUID válido',
  })
  productoProveedorId!: string;

  @IsNumber({}, { message: 'El precio debe ser un número válido' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  precio!: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe ser una fecha válida' })
  fecha?: string;
}
