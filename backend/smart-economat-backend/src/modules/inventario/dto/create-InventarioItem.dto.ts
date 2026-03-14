import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { StringToDateTransformer } from '../../../common/transformers/string-to-date.transformer';

export class CreateInventarioItemDto {
  @IsUUID('7', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PRODUCTO_PROVEEDOR_DEBE_SER_UN'
    ),
  })
  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_PRODUCTO_PROVEEDOR_ES_OBLIGATO'
    ),
  })
  productoProveedorId: string;

  @Type(() => Number)
  @IsNumber(
    {},
    {
      message: i18nValidationMessage(
        'validation.LA_CANTIDAD_ACTUAL_DEBE_SER_UN_N_MERO'
      ),
    }
  )
  @Min(0, {
    message: i18nValidationMessage(
      'validation.LA_CANTIDAD_ACTUAL_NO_PUEDE_SER_NEGATIVA'
    ),
  })
  cantidadActual: number;

  @Type(() => Number)
  @IsNumber(
    {},
    {
      message: i18nValidationMessage(
        'validation.LA_CANTIDAD_M_NIMA_DEBE_SER_UN_N_MERO'
      ),
    }
  )
  @Min(0, {
    message: i18nValidationMessage(
      'validation.LA_CANTIDAD_M_NIMA_NO_PUEDE_SER_NEGATIVA'
    ),
  })
  cantidadMinima: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {},
    {
      message: i18nValidationMessage(
        'validation.LA_CANTIDAD_M_XIMA_DEBE_SER_UN_N_MERO'
      ),
    }
  )
  @Min(0, {
    message: i18nValidationMessage(
      'validation.LA_CANTIDAD_M_XIMA_NO_PUEDE_SER_NEGATIVA'
    ),
  })
  cantidadMaxima?: number;

  @IsUUID('7', {
    message: i18nValidationMessage(
      'validation.EL_ID_DE_LA_UBICACI_N_DEBE_SER_UN_UUID_V'
    ),
  })
  @IsNotEmpty({
    message: i18nValidationMessage(
      'validation.EL_ID_DE_LA_UBICACI_N_ES_OBLIGATORIO'
    ),
  })
  ubicacionId: string;

  @IsOptional()
  @Transform((params) => StringToDateTransformer.transform(params))
  @Type(() => Date)
  @IsDateString(
    {},
    {
      message: i18nValidationMessage(
        'validation.LA_FECHA_DE_CADUCIDAD_DEBE_SER_UNA_FECHA'
      ),
    }
  )
  fechaCaducidad?: string;
}
