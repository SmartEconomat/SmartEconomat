import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { rolUsuario, UserStatus } from '../enums/usuario.enums';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { LowercaseStringTransformer } from '../../../common/transformers/lowercase-string.transformer';

export class CreateUsuarioDto {
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString({
    message: i18nValidationMessage(
      'validation.EL_NOMBRE_DE_USUARIO_DEBE_SER_UNA_CADENA'
    ),
  })
  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.EL_NOMBRE_DE_USUARIO_ES_OBLIGATORIO'
    ),
  })
  @MaxLength(100, {
    message: i18nValidationMessage(
      'validation.EL_NOMBRE_DE_USUARIO_NO_PUEDE_EXCEDER_LO'
    ),
  })
  username!: string;

  @IsString({
    message: i18nValidationMessage(
      'validation.LA_CONTRASE_A_DEBE_SER_UNA_CADENA_DE_TEX'
    ),
  })
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

  @IsOptional()
  @ValidateIf((o) => o.email != null)
  @Transform((params) => LowercaseStringTransformer.transform(params))
  @IsEmail({}, { message: i18nValidationMessage('validation.INVALID_EMAIL') })
  @MaxLength(255, {
    message: i18nValidationMessage(
      'validation.EL_CORREO_ELECTR_NICO_NO_PUEDE_EXCEDER_L'
    ),
  })
  email?: string | null;

  @IsEnum(rolUsuario, {
    message: i18nValidationMessage('validation.EL_ROL_DE_USUARIO_NO_ES_V_LIDO'),
  })
  rol!: rolUsuario;

  @IsEnum(UserStatus, {
    message: i18nValidationMessage('validation.EL_ESTADO_NO_ES_V_LIDO'),
  })
  status!: UserStatus;
}
