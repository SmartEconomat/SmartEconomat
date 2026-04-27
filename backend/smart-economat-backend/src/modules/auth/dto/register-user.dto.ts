import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsStrongPassword,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { rolUsuario, UserLanguage } from '../../usuario/enums/usuario.enums';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { LowercaseStringTransformer } from '../../../common/transformers/lowercase-string.transformer';

export class RegisterUserDto {
  @Transform((params) => TrimStringTransformer.transform(params))
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
  @Transform((params) => LowercaseStringTransformer.transform(params))
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(rolUsuario)
  rol?: rolUsuario;

  @IsOptional()
  @IsEnum(UserLanguage)
  idioma?: UserLanguage;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: rolUsuario;
}
