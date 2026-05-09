import { i18nValidationMessage } from 'nestjs-i18n';
import { IsEnum } from 'class-validator';
import { UserStatus } from '../enums/usuario.enums';

/** Clase pública (UpdateUsuarioStatusDto). Paquete: smart-economat-backend (Nest). */
export class UpdateUsuarioStatusDto {
  @IsEnum(UserStatus, {
    message: i18nValidationMessage('validation.EL_ESTADO_NO_ES_V_LIDO'),
  })
  status!: UserStatus;
}
