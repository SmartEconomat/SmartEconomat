import { i18nValidationMessage } from 'nestjs-i18n';
import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { TipoResolucion } from '../enums/incidencia.enums';

export class CreateIncidenciaDto {
  @IsUUID('7', {
    message: i18nValidationMessage(
      'validation.EL_ID_DE_LA_RECEPCI_N_DEBE_SER_UN_UUID_V'
    ),
  })
  recepcionId: string;

  @IsUUID('7')
  pedidoId!: string;

  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  observacionesRecepcion?: string;
}

export class CreateIncidenciaResuelaDto {
  @IsUUID('7', {
    message: i18nValidationMessage(
      'validation.EL_ID_DE_LA_INCIDENCIA_DEBE_SER_UN_UUID'
    ),
  })
  idIncidencia!: string;

  @IsUUID('7', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_USUARIO_DEBE_SER_UN_UUID_V_LID'
    ),
  })
  idUsuarioResolutor!: string;

  @IsEnum(TipoResolucion)
  tipoResolucion: TipoResolucion;

  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  observaciones?: string;
}
