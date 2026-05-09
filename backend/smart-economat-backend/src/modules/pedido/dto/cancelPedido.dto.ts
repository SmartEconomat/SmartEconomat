import { i18nValidationMessage } from 'nestjs-i18n';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Clase pública (CancelPedidoDto). Paquete: smart-economat-backend (Nest). */
export class CancelPedidoDto {
  @IsString({
    message: i18nValidationMessage(
      'validation.EL_MOTIVO_DE_CANCELACI_N_DEBE_SER_UNA_CA'
    ),
  })
  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.EL_MOTIVO_DE_CANCELACI_N_ES_OBLIGATORIO'
    ),
  })
  @MaxLength(1000, {
    message: i18nValidationMessage(
      'validation.EL_MOTIVO_DE_CANCELACI_N_NO_PUEDE_EXCEDE'
    ),
  })
  motivoCancelacion: string;
}
