import { i18nValidationMessage } from 'nestjs-i18n';
import { IsUUID, IsNumber, Min, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHistorialPrecioDto {
  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PRODUCTO_PROVEEDOR_DEBE_SER_UN_1'
    ),
  })
  productoProveedorId!: string;

  @IsNumber(
    {},
    {
      message: i18nValidationMessage(
        'validation.EL_PRECIO_DEBE_SER_UN_N_MERO_V_LIDO'
      ),
    }
  )
  @Min(0.01, {
    message: i18nValidationMessage('validation.EL_PRECIO_DEBE_SER_MAYOR_QUE_0'),
  })
  precio!: number;

  @IsOptional()
  @IsDate({
    message: i18nValidationMessage(
      'validation.LA_FECHA_DEBE_SER_UNA_FECHA_V_LIDA'
    ),
  })
  @Type(() => Date)
  fecha?: Date;
}
