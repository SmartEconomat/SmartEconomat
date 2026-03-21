import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { rolUsuario, UserStatus } from '../enums/usuario.enums';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { LowercaseStringTransformer } from '../../../common/transformers/lowercase-string.transformer';

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage('validation.EL_NOMBRE_DEBE_SER_UNA_CADENA'),
  })
  @MaxLength(150)
  nombre?: string | null;
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString({
    message: i18nValidationMessage(
      'validation.EL_NOMBRE_DE_USUARIO_DEBE_SER_UNA_CADENA'
    ),
  })
  @MaxLength(100, {
    message: i18nValidationMessage(
      'validation.EL_NOMBRE_DE_USUARIO_NO_PUEDE_EXCEDER_LO'
    ),
  })
  username?: string;

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

  @IsOptional()
  @IsEnum(rolUsuario)
  rol?: rolUsuario;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString({
    message: i18nValidationMessage(
      'validation.EL_CIAL_DEBE_SER_UNA_CADENA_DE_TEXTO'
    ),
  })
  @MaxLength(100)
  cialProfesor?: string;

  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString({
    message: i18nValidationMessage(
      'validation.EL_N_MERO_DE_CLASE_DEBE_SER_UNA_CADENA_D'
    ),
  })
  @MaxLength(10)
  numeroClase?: string;

  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString({
    message: i18nValidationMessage(
      'validation.EL_AULA_DEBE_SER_UNA_CADENA_DE_TEXTO'
    ),
  })
  @MaxLength(50)
  aula?: string;
}
