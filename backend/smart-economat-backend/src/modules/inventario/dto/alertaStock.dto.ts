import { i18nValidationMessage } from 'nestjs-i18n';
import { IsUUID, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class AlertaStockDTO {
  @IsUUID('7', {
    message: i18nValidationMessage('validation.EL_ID_DEBE_SER_UN_UUID_V_LIDO'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.EL_ID_ES_OBLIGATORIO'),
  })
  id: string;

  @IsNumber(
    {},
    {
      message: i18nValidationMessage(
        'validation.LA_CANTIDAD_M_NIMA_DEBE_SER_UN_N_MERO'
      ),
    }
  )
  @Min(0, {
    message: i18nValidationMessage(
      'validation.LA_CANTIDAD_M_NIMA_NO_PUEDE_SER_NEGATIVA'
    ),
  })
  cantidadMinima: number;

  @IsNumber(
    {},
    {
      message: i18nValidationMessage(
        'validation.LA_CANTIDAD_ACTUAL_DEBE_SER_UN_N_MERO'
      ),
    }
  )
  @Min(0, {
    message: i18nValidationMessage(
      'validation.LA_CANTIDAD_ACTUAL_NO_PUEDE_SER_NEGATIVA'
    ),
  })
  cantidadActual: number;
}
