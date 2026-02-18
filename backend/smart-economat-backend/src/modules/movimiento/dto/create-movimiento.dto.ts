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
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad!: number;

  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(1000, {
    message: 'La descripción no puede exceder los 1000 caracteres',
  })
  descripcion?: string;

  @IsUUID('7', { message: 'El ID del inventario debe ser un UUID válido' })
  inventario!: string;

  @IsUUID('7', { message: 'El ID del usuario debe ser un UUID válido' })
  usuario!: string;
}
