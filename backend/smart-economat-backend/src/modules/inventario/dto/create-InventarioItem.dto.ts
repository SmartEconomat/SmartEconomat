import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  IsDateString,
} from 'class-validator';
export class CreateInventarioItemDto {
  @IsUUID('7', {
    message: 'El id del producto-proveedor debe ser un UUID válido',
  })
  @IsNotEmpty({ message: 'El id del producto-proveedor es obligatorio' })
  productoProveedorId: string;

  @IsNumber({}, { message: 'La cantidad actual debe ser un número' })
  @Min(0, { message: 'La cantidad actual no puede ser negativa' })
  cantidadActual: number;

  @IsNumber({}, { message: 'La cantidad mínima debe ser un número' })
  @Min(0, { message: 'La cantidad mínima no puede ser negativa' })
  cantidadMinima: number;

  @IsOptional()
  @IsNumber({}, { message: 'La cantidad máxima debe ser un número' })
  @Min(0, { message: 'La cantidad máxima no puede ser negativa' })
  cantidadMaxima?: number;

  @IsUUID('7', { message: 'El id de la ubicación debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El id de la ubicación es obligatorio' })
  ubicacionId: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de caducidad debe ser una fecha válida (ISO 8601)' }
  )
  fechaCaducidad?: string;
}
