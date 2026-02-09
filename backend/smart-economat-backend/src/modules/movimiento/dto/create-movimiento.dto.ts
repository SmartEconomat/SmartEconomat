import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { TipoMovimiento } from '../enums/movimiento.enums';
import { Usuario } from 'src/modules/usuario/usuario.entity/usuario.entity';

export class CreateMovimientoDto {
  @IsEnum(TipoMovimiento)
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
  usuario!: Usuario;
}
