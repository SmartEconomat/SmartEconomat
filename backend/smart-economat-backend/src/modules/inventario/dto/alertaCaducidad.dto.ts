import { i18nValidationMessage } from 'nestjs-i18n';
import { IsUUID, IsDateString, IsNotEmpty } from 'class-validator';

export class AlertaCaducidadDTO {
  @IsUUID('all', {
    message: i18nValidationMessage('validation.EL_ID_DEBE_SER_UN_UUID_V_LIDO'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.EL_ID_ES_OBLIGATORIO'),
  })
  id: string;

  @IsDateString(
    {},
    {
      message: i18nValidationMessage(
        'validation.LA_FECHA_DE_CADUCIDAD_DEBE_SER_UNA_FECHA'
      ),
    }
  )
  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.LA_FECHA_DE_CADUCIDAD_ES_OBLIGATORIA'
    ),
  })
  fechaCaducidad: string;
}
