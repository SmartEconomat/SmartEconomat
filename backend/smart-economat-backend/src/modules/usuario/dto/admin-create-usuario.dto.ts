import {
  ArrayUnique,
  IsEmail,
  IsEnum,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { rolUsuario, UserLanguage } from '../enums/usuario.enums';

/** Clase pública (AdminCreateUsuarioDto). Paquete: smart-economat-backend (Nest). */
export class AdminCreateUsuarioDto {
  @IsOptional()
  @IsEnum(UserLanguage, {
    message: i18nValidationMessage('validation.IDIOMA_INVALIDO'),
  })
  idioma?: UserLanguage;

  @IsString({
    message: i18nValidationMessage(
      'validation.NOMBRE_COMPLETO_DEBE_SER_CADENA'
    ),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOMBRE_COMPLETO_OBLIGATORIO'),
  })
  @MaxLength(150, {
    message: i18nValidationMessage('validation.NOMBRE_COMPLETO_MAX_LENGTH'),
  })
  nombre!: string;

  @IsString({
    message: i18nValidationMessage('validation.NOMBRE_USUARIO_DEBE_SER_CADENA'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOMBRE_USUARIO_OBLIGATORIO'),
  })
  @MaxLength(100, {
    message: i18nValidationMessage('validation.NOMBRE_USUARIO_MAX_LENGTH'),
  })
  username!: string;

  @IsString({
    message: i18nValidationMessage('validation.CONTRASEÑA_DEBE_SER_CADENA'),
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
      message: i18nValidationMessage('validation.CONTRASEÑA_FUERTE_REQUERIDA'),
    }
  )
  password!: string;

  @IsOptional()
  @IsEmail(
    {},
    {
      message: i18nValidationMessage('validation.INVALID_EMAIL'),
    }
  )
  @MaxLength(255, {
    message: i18nValidationMessage('validation.CORREO_ELECTRONICO_MAX_LENGTH'),
  })
  email?: string | null;

  @IsEnum(rolUsuario, {
    message: i18nValidationMessage('validation.ROL_USUARIO_NO_VALIDO'),
  })
  rol!: rolUsuario;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage('validation.AULA_CLASE_DEBE_SER_CADENA'),
  })
  aula?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage('validation.CIAL_DEBE_SER_CADENA'),
  })
  cial?: string;

  @IsOptional()
  @IsUUID('all', {
    message: i18nValidationMessage('validation.UBICACION_ID_UUIDV7_INVALIDO'),
  })
  ubicacionId?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.UBICACION_ID_UUIDV7_INVALIDO'),
  })
  ubicacionesIds?: string[];
}
