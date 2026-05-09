import { i18nValidationMessage } from 'nestjs-i18n';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { Alergeno } from '../../enums/producto.enums';

/** Clase pública (CreateProductoAlergenoDto). Paquete: smart-economat-backend (Nest). */
export class CreateProductoAlergenoDto {
  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PRODUCTO_DEBE_SER_UN_UUID_V_LI'
    ),
  })
  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PRODUCTO_ES_OBLIGATORIO'
    ),
  })
  idProducto: string;

  @IsEnum(Alergeno, {
    message: i18nValidationMessage(
      'validation.EL_AL_RGENO_INDICADO_NO_ES_V_LIDO'
    ),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.EL_AL_RGENO_ES_OBLIGATORIO'),
  })
  alergeno: Alergeno;
}
