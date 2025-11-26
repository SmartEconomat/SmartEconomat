import { IsInt, IsEnum, IsOptional, IsUUID, IsString } from 'class-validator';
import { TipoMovimiento } from '../enums/movimiento.enums';

export class CreateMovimientoDto {
  @IsEnum(TipoMovimiento)
  tipo: TipoMovimiento;

  @IsInt()
  cantidad: number;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsUUID()
  usuarioId: string;

  @IsUUID()
  inventario: string;
}
