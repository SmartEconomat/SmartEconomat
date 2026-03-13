import { i18nValidationMessage } from 'nestjs-i18n';
import { IsArray, IsEnum, ArrayNotEmpty } from 'class-validator';
import { Alergeno } from '../../enums/producto.enums';

export class UpdateProductoAlergenoDto {
  @IsArray({
    message: i18nValidationMessage(
      'validation.LOS_AL_RGENOS_DEBEN_SER_UN_ARRAY'
    ),
  })
  @ArrayNotEmpty({
    message: i18nValidationMessage(
      'validation.LA_LISTA_DE_AL_RGENOS_NO_PUEDE_ESTAR_VAC'
    ),
  })
  @IsEnum(Alergeno, {
    each: true,
    message: i18nValidationMessage(
      'validation.UNO_O_M_S_AL_RGENOS_INDICADOS_NO_SON_V_L'
    ),
  })
  alergenos: Alergeno[];
}
