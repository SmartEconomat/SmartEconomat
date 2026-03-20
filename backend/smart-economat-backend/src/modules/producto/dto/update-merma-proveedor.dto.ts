import { i18nValidationMessage } from 'nestjs-i18n';
import { IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMermaProveedorDto {
  @ApiProperty({
    description:
      'Nueva merma esperada del proveedor (porcentaje de pérdida histórica). 0 = sin merma.',
    example: 4.5,
    minimum: 0,
    maximum: 99.99,
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
  @Max(99.99, { message: 'La merma esperada no puede superar el 99.99%.' })
  @IsNotEmpty({ message: 'La merma esperada es obligatoria.' })
  nuevaMerma: number;
}
