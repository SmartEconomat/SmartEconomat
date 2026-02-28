import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { TipoMovimiento } from '../enums/movimiento.enums';

export class CreateMovimientoDto {
  @IsEnum(TipoMovimiento, { message: 'El tipo de movimiento no es válido' })
  tipo!: TipoMovimiento;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(0, { message: 'La cantidad no puede ser negativa' })
  cantidad!: number;

  @IsString({ message: 'El tipo de entidad debe ser una cadena de texto' })
  entidadTipo!: string;

  @IsString({ message: 'El ID de entidad debe ser una cadena de texto' })
  entidadId!: string;

  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(1000, {
    message: 'La descripción no puede exceder los 1000 caracteres',
  })
  descripcion?: string;

  @IsUUID('7', { message: 'El ID del inventario debe ser un UUID válido' })
  @IsOptional()
  inventario?: string;

  @IsUUID('7', { message: 'El ID del usuario debe ser un UUID válido' })
  @IsOptional()
  usuario?: string;
}
