import { i18nValidationMessage } from 'nestjs-i18n';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsNotEmpty({
    message: i18nValidationMessage('validation.EL_EMAIL_ES_REQUERIDO'),
  })
  @IsEmail(
    {},
    { message: i18nValidationMessage('validation.DEBE_SER_UN_EMAIL_V_LIDO') }
  )
  email!: string;
}
