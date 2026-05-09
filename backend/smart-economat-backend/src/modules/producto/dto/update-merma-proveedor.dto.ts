import { i18nValidationMessage } from 'nestjs-i18n';
import { IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Clase pública (UpdateMermaProveedorDto). Paquete: smart-economat-backend (Nest). */
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
  @Max(99.99, {
    message: i18nValidationMessage(
      'validation.MERMA_ESPERADA_NO_DEFAULT_SUPERAR'
    ),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.MERMA_ESPERADA_OBLIGATORIA'),
  })
  nuevaMerma: number;
}
