import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchProductoProveedorDto {
  @IsOptional()
  @IsString({
    message: i18nValidationMessage(
      'validation.EL_T_RMINO_DE_B_SQUEDA_DEBE_SER_UNA_CADE'
    ),
  })
  @MaxLength(100, {
    message: i18nValidationMessage(
      'validation.EL_T_RMINO_DE_B_SQUEDA_NO_PUEDE_EXCEDER'
    ),
  })
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: i18nValidationMessage('validation.EL_OFFSET_DEBE_SER_UN_ENTERO'),
  })
  @Min(0, {
    message: i18nValidationMessage(
      'validation.EL_OFFSET_NO_PUEDE_SER_NEGATIVO'
    ),
  })
  offset?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: i18nValidationMessage('validation.EL_L_MITE_DEBE_SER_UN_ENTERO'),
  })
  @Min(1, {
    message: i18nValidationMessage('validation.EL_L_MITE_DEBE_SER_AL_MENOS_1'),
  })
  @Max(50, {
    message: i18nValidationMessage('validation.EL_L_MITE_NO_PUEDE_EXCEDER_50'),
  })
  limit?: number = 20;
}
