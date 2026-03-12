import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LoginUserDto {
  @IsString({
    message: i18nValidationMessage('translation.validation.INVALID_EMAIL'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('translation.validation.MISSING_EMAIL'),
  })
  email: string;

  @IsString({
    message: i18nValidationMessage('translation.validation.INVALID_PASSWORD'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('translation.validation.MISSING_PASSWORD'),
  })
  password: string;
}
