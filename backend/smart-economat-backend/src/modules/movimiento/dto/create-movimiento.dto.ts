import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { TipoMovimiento } from '../enums/movimiento.enums';

export class CreateMovimientoDto {
  @IsEnum(TipoMovimiento, { message: 'Tipo de movimiento inválido' })
  tipo!: TipoMovimiento;

  @IsInt()
  @Min(1)
  cantidad!: number;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsUUID()
  inventario!: string;

  @IsUUID()
  usuario!: string;
}
