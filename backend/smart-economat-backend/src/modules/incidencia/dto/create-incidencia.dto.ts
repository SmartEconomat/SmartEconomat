import { i18nValidationMessage } from 'nestjs-i18n';
import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';
import { TipoResolucion } from '../enums/incidencia.enums';

export class CreateIncidenciaDto {
  @IsUUID('7', {
    message: i18nValidationMessage(
      'validation.EL_ID_DE_LA_RECEPCI_N_DEBE_SER_UN_UUID_V'
    ),
  })
  recepcionId: string;

  @IsOptional()
  @IsUUID('7')
  pedidoId?: string;

  @IsOptional()
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

  @IsOptional()
  @IsUUID('7')
  idUsuarioResolutor?: string;

  @IsOptional()
  @IsEnum(TipoResolucion)
  tipoResolucion?: TipoResolucion;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
