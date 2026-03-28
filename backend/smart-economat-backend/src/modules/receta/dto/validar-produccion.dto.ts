import {
  IsArray,
  IsNumber,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Type } from 'class-transformer';

class ValidarItemDto {
  @IsUUID('7', {
    message: i18nValidationMessage('validation.ID_RECETA_INVALIDO'),
  })
  recetaId!: string;

  @IsNumber(
    {},
    {
      message: i18nValidationMessage('validation.CANTIDAD_DEBE_SER_NUMERO'),
    }
  )
  @IsPositive({
    message: i18nValidationMessage('validation.CANTIDAD_DEBE_SER_POSITIVA'),
  })
  cantidad!: number;
}

export class ValidarProduccionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidarItemDto)
  items!: ValidarItemDto[];
}
