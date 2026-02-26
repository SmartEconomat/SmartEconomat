import { IsEnum } from 'class-validator';
import { rolUsuario } from '../enums/usuario.enums';

export class UpdateUsuarioRolDto {
  @IsEnum(rolUsuario, { message: 'El rol de usuario no es válido' })
  rol!: rolUsuario;
}
