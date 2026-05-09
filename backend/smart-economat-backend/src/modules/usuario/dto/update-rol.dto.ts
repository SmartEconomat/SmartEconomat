import { i18nValidationMessage } from 'nestjs-i18n';
import { IsEnum } from 'class-validator';
import { rolUsuario } from '../enums/usuario.enums';

/** Clase pública (UpdateUsuarioRolDto). Paquete: smart-economat-backend (Nest). */
export class UpdateUsuarioRolDto {
  @IsEnum(rolUsuario, {
    message: i18nValidationMessage('validation.EL_ROL_DE_USUARIO_NO_ES_V_LIDO'),
  })
  rol!: rolUsuario;
}
