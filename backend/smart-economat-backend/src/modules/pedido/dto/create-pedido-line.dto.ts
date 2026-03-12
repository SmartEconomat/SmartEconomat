import { i18nValidationMessage } from 'nestjs-i18n';
import { IsNotEmpty, IsUUID, IsPositive } from 'class-validator';

export class CreatePedidoLineDto {
  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PRODUCTOPROVEEDOR_NO_PUEDE_EST'
    ),
  })
  @IsUUID('7', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PRODUCTOPROVEEDOR_DEBE_SER_UN'
    ),
  })
  productoProveedorId!: string;

  @IsNotEmpty({
    message: i18nValidationMessage('validation.LA_CANTIDAD_NO_PUEDE_EST_VAC_A'),
  })
  @IsPositive({
    message: i18nValidationMessage(
      'validation.LA_CANTIDAD_DEBE_SER_MAYOR_QUE_0'
    ),
  })
  cantidad!: number;
}
