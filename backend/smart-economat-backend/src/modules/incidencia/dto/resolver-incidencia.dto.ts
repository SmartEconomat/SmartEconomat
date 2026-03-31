import { i18nValidationMessage } from 'nestjs-i18n';
import { IsUUID, IsOptional, IsString } from 'class-validator';

export class ResolverIncidenciaDto {
  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_USUARIO_DEBE_SER_UN_UUID_V_LID'
    ),
  })
  usuarioId!: string;

  @IsOptional()
  @IsString()
  observacionesResolucion?: string;
}
