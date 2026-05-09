import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsIn, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { firstNonEmptyString } from '../../../common/dto/transform-query.helpers';
import { TipoMovimiento } from '../enums/movimiento.enums';

function normalizeTipos(value: unknown): TipoMovimiento[] | undefined {
  if (value == null || value === '') return undefined;

  if (Array.isArray(value)) {
    return value.filter(Boolean) as TipoMovimiento[];
  }

  return [value as TipoMovimiento];
}

/** Clase pública (MovimientoListQueryDto). Paquete: smart-economat-backend (Nest). */
export class MovimientoListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    const raw = firstNonEmptyString(value);
    return raw === undefined ? undefined : raw.toUpperCase();
  })
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @Transform(({ value }) => normalizeTipos(value))
  @IsEnum(TipoMovimiento, {
    each: true,
    message: i18nValidationMessage(
      'validation.EL_TIPO_DE_MOVIMIENTO_NO_ES_V_LIDO'
    ),
  })
  type?: TipoMovimiento[];

  @IsOptional()
  @Transform(
    ({ value, obj }: { value: unknown; obj: { dateFrom?: unknown } }) =>
      firstNonEmptyString(obj.dateFrom, value)
  )
  @IsDateString(
    {},
    {
      message: i18nValidationMessage(
        'validation.LA_FECHA_DE_INICIO_DEBE_SER_UNA_FECHA_V'
      ),
    }
  )
  startDate?: string;

  @IsOptional()
  @Transform(({ value, obj }: { value: unknown; obj: { dateTo?: unknown } }) =>
    firstNonEmptyString(obj.dateTo, value)
  )
  @IsDateString(
    {},
    {
      message: i18nValidationMessage(
        'validation.LA_FECHA_DE_FIN_DEBE_SER_UNA_FECHA_V_LID'
      ),
    }
  )
  endDate?: string;
}
