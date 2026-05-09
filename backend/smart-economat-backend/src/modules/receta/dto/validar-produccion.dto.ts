import {
  IsArray,
  IsUUID,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Transform, Type } from 'class-transformer';
import { StringToNumberTransformer } from '../../../common/transformers/string-to-number.transformer';

class ValidarItemDto {
  @IsUUID('all', {
    message: i18nValidationMessage('validation.ID_RECETA_INVALIDO'),
  })
  recetaId!: string;

  /**
   * Escala de producción respecto a la receta (coeficiente aplicado vía rendimiento).
   * Permite decimales; no tiene por qué coincidir con el paso de 0,5 de las preparaciones persistidas.
   */
  @Transform((params) => StringToNumberTransformer.transform(params))
  @IsNumber()
  @Min(0.001)
  cantidadAProducir!: number;
}

/** Clase pública (ValidarProduccionDto). Paquete: smart-economat-backend (Nest). */
export class ValidarProduccionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidarItemDto)
  items!: ValidarItemDto[];
}
