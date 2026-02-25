import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  IsDateString,
} from 'class-validator';
import { localInventario } from '../enums/inventario.enums';

export class CreateInventarioDto {
  @IsUUID('all', {
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

  @IsEnum(localInventario, { message: 'La ubicación del almacén no es válida' })
  ubicacionAlmacen: localInventario;

  @IsDateString(
    {},
    { message: 'La fecha de caducidad debe ser una fecha válida (ISO 8601)' }
  )
  @IsNotEmpty({ message: 'La fecha de caducidad es obligatoria' })
  fechaCaducidad: string;
}
