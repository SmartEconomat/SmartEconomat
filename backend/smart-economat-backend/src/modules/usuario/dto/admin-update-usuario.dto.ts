import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { rolUsuario } from '../enums/usuario.enums';

export class AdminUpdateUsuarioDto {
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un booleano' })
  activo?: boolean;

  @IsOptional()
  @IsEnum(rolUsuario, { message: 'El rol de usuario no es válido' })
  rol?: rolUsuario;
}
