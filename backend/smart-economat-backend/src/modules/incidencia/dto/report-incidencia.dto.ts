import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { TipoIncidencia } from '../enums/incidencia.enums';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ReportIncidenciaDto {
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  @IsUUID('7', { message: i18nValidationMessage('validation.INVALID_UUID') })
  recepcionId: string;

  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  @IsEnum(TipoIncidencia, {
    message: i18nValidationMessage('validation.INVALID_ENUM'),
  })
  tipo: TipoIncidencia;
}
