import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsStrongPassword,
  IsOptional,
} from 'class-validator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo',
    }
  )
  password: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(rolUsuario)
  rol?: rolUsuario;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: rolUsuario;
}
