import { i18nValidationMessage } from 'nestjs-i18n';
import { IsUUID, IsNumber, Min, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHistorialPrecioDto {
  @IsUUID('7', {
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
  @Min(0, {
    message: i18nValidationMessage(
      'validation.EL_PRECIO_NO_PUEDE_SER_NEGATIVO'
    ),
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
