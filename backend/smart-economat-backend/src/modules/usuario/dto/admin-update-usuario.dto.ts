import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { rolUsuario } from '../enums/usuario.enums';

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
}
