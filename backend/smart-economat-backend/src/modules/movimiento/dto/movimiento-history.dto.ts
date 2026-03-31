import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoMovimiento } from '../enums/movimiento.enums';

/**
 * DTO para consultar el historial de movimientos de un producto o usuario.
 * Soporta búsqueda por:
 * - Producto: via entityId (ID del ProductoProveedor)
 * - Usuario: via userId (ID del Usuario)
 * - Filtrado por tipo de movimiento y rango de fechas
 */
export class MovimientoHistoryDto {
  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DE_LA_ENTIDAD_DEBE_SER_UN_UUID_V_L'
    ),
  })
  @IsOptional()
  entityId?: string;

  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_USUARIO_DEBE_SER_UN_UUID_V_LID'
    ),
  })
  @IsOptional()
  userId?: string;

  @IsOptional()
  @IsEnum(TipoMovimiento, {
    message: i18nValidationMessage(
      'validation.EL_TIPO_DE_MOVIMIENTO_NO_ES_V_LIDO'
    ),
  })
  type?: TipoMovimiento;

  @IsOptional()
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
  @IsDateString(
    {},
    {
      message: i18nValidationMessage(
        'validation.LA_FECHA_DE_FIN_DEBE_SER_UNA_FECHA_V_LID'
      ),
    }
  )
  endDate?: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage(
      'validation.EL_SORTEO_DEBE_SER_UNA_CADENA_V_LIDA'
    ),
  })
  sortBy?: 'createdAt' | 'cantidad';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'], {
    message: i18nValidationMessage('validation.EL_ORDEN_DEBE_SER_ASC_O_DESC'),
  })
  sortOrder?: 'ASC' | 'DESC';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
