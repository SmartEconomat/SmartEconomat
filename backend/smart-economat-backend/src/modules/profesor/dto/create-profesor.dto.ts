import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserLanguage } from '../../usuario/enums/usuario.enums';

/** Clase pública (CreateProfesorDto). Paquete: smart-economat-backend (Nest). */
export class CreateProfesorDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

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
  password!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : String(value)
  )
  @IsString()
  @IsNotEmpty()
  cial!: string;

  @IsOptional()
  @IsEnum(UserLanguage)
  idioma?: UserLanguage;
}
