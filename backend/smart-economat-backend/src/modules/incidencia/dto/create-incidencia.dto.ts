import { i18nValidationMessage } from 'nestjs-i18n';
import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { TipoResolucion } from '../enums/incidencia.enums';

export class CreateIncidenciaDto {
  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DE_LA_RECEPCI_N_DEBE_SER_UN_UUID_V'
    ),
  })
  recepcionId: string;

  @IsOptional()
  @IsUUID('all')
  pedidoId?: string;

  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  observacionesRecepcion?: string;
}

export class CreateIncidenciaResuelaDto {
  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DE_LA_INCIDENCIA_DEBE_SER_UN_UUID'
    ),
  })
  idIncidencia!: string;

  @IsOptional()
  @IsUUID('all')
  idUsuarioResolutor?: string;

  @IsEnum(TipoResolucion)
  tipoResolucion: TipoResolucion;

  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  observaciones?: string;
}
