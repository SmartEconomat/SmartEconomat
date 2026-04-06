import { i18nValidationMessage } from 'nestjs-i18n';
import { IsUUID, IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class CreatePedidoProductoDto {
  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PRODUCTOPROVEEDOR_DEBE_SER_UN'
    ),
  })
  idProductoProveedor!: string;

  @IsNumber(
    {},
    {
      message: i18nValidationMessage(
        'validation.LA_CANTIDAD_DEBE_SER_NUM_RICA'
      ),
    }
  )
  @Min(0.001, {
    message: i18nValidationMessage(
      'validation.LA_CANTIDAD_DEBE_SER_MAYOR_QUE_0'
    ),
  })
  cantidad!: number;

  @IsNumber(
    {},
    {
      message: i18nValidationMessage(
        'validation.EL_PRECIO_UNITARIO_DEBE_SER_NUM_RICO'
      ),
    }
  )
  @Min(0, {
    message: i18nValidationMessage(
      'validation.EL_PRECIO_UNITARIO_NO_PUEDE_SER_NEGATIVO'
    ),
  })
  precioUnitario!: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
