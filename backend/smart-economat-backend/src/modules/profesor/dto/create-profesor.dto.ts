import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';

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
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  cial!: string;
}
