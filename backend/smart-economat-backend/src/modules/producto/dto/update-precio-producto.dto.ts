import { i18nValidationMessage } from 'nestjs-i18n';
import { IsNumber, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
  @Min(0, {
    message: i18nValidationMessage(
      'validation.EL_PRECIO_NO_PUEDE_SER_NEGATIVO'
    ),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.EL_PRECIO_ES_OBLIGATORIO'),
  })
  nuevoPrecio: number;
}
