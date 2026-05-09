import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { rolUsuario } from '../enums/usuario.enums';

/** Clase pública (AdminUpdateUsuarioDto). Paquete: smart-economat-backend (Nest). */
export class AdminUpdateUsuarioDto {
  @IsOptional()
  @IsBoolean({
    message: i18nValidationMessage(
      'validation.ESTADO_ACTIVO_DEBE_SER_BOOLEANO'
    ),
  })
  activo?: boolean;

  @IsOptional()
  @IsEnum(rolUsuario, {
    message: i18nValidationMessage('validation.ROL_USUARIO_NO_VALIDO'),
  })
  rol?: rolUsuario;

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
