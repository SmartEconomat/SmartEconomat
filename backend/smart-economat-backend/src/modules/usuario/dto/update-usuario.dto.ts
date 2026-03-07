import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { rolUsuario, UserStatus } from '../enums/usuario.enums';

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  @MaxLength(100, {
    message: 'El nombre de usuario no puede exceder los 100 caracteres',
  })
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @MaxLength(255, {
    message: 'El correo electrónico no puede exceder los 255 caracteres',
  })
  email?: string;

  @IsOptional()
  @IsEnum(rolUsuario)
  rol?: rolUsuario;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString({ message: 'El CIAL debe ser una cadena de texto' })
  @MaxLength(100)
  cialProfesor?: string;

  @IsOptional()
  @IsString({ message: 'El número de clase debe ser una cadena de texto' })
  @MaxLength(10)
  numeroClase?: string;

  @IsOptional()
  @IsString({ message: 'El aula debe ser una cadena de texto' })
  @MaxLength(50)
  aula?: string;
}
