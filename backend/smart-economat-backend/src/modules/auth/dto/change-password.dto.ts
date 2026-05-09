import { i18nValidationMessage } from 'nestjs-i18n';
import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

/** Clase pública (ChangePasswordDto). Paquete: smart-economat-backend (Nest). */
export class ChangePasswordDto {
  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.LA_CONTRASE_A_ACTUAL_ES_REQUERIDA'
    ),
  })
  @IsString()
  currentPassword!: string;

  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.LA_NUEVA_CONTRASE_A_ES_REQUERIDA'
    ),
  })
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
        'validation.LA_NUEVA_CONTRASE_A_DEBE_TENER_AL_MENOS'
      ),
    }
  )
  newPassword!: string;
}
