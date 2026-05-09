import { i18nValidationMessage } from 'nestjs-i18n';
import { IsNumber, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Clase pública (UpdatePrecioProductoDto). Paquete: smart-economat-backend (Nest). */
export class UpdatePrecioProductoDto {
  @ApiProperty({
    description: 'docs.NUEVO_PRECIO_UNITARIO_DEL_PRODUCTO_DEL_P',
    example: 10.5,
  })
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
  @IsNotEmpty({
    message: i18nValidationMessage('validation.EL_PRECIO_ES_OBLIGATORIO'),
  })
  nuevoPrecio: number;
}
