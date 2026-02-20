import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { rolUsuario } from '../../enums/usuario.enums';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEmail()
  email: string;

  @IsEnum(rolUsuario)
  rol: rolUsuario;
}
