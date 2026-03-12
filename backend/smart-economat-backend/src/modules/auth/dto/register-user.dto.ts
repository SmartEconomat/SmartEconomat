import { i18nValidationMessage } from 'nestjs-i18n';
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
      message: i18nValidationMessage(
        'validation.LA_CONTRASE_A_DEBE_TENER_AL_MENOS_8_CARA'
      ),
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
