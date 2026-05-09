import { i18nValidationMessage } from 'nestjs-i18n';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { EstadoReclamacion } from '../enums/incidencia.enums';

/** Catálogo de valores enumerados (EstadoFinalIncidenciaDto) dentro de smart-economat-backend (Nest). */
export enum EstadoFinalIncidenciaDto {
  RESUELTA = 'resuelta',
  CANCELADA = 'cancelada',
  INVALIDA = 'invalida',
}

function toOptionalBoolean(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }

    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }

  if (typeof value === 'number') {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }
  }

  return value;
}

/** Clase pública (ResolverIncidenciaLineaDto). Paquete: smart-economat-backend (Nest). */
export class ResolverIncidenciaLineaDto {
  @IsOptional()
  @IsUUID('all', {
    message: i18nValidationMessage('validation.INVALID_UUID'),
  })
  id?: string;

  @IsOptional()
  @IsUUID('all', {
    message: i18nValidationMessage('validation.INVALID_UUID'),
  })
  pedidoProductoId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 3 },
    {
      message: i18nValidationMessage('validation.MUST_BE_NUMBER'),
    }
  )
  @Min(0, {
    message: i18nValidationMessage('validation.MIN', { min: 0 }),
  })
  cantidadRecibida?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 3 },
    {
      message: i18nValidationMessage('validation.MUST_BE_NUMBER'),
    }
  )
  cantidadAjustada?: number;

  @IsOptional()
  @IsEnum(EstadoReclamacion, {
    message: i18nValidationMessage('validation.INVALID_ENUM'),
  })
  estadoReclamacion?: EstadoReclamacion;

  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString({ message: i18nValidationMessage('validation.MUST_BE_STRING') })
  observaciones?: string;
}

/** Clase pública (ResolverIncidenciaDto). Paquete: smart-economat-backend (Nest). */
export class ResolverIncidenciaDto {
  @IsOptional()
  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DEL_USUARIO_DEBE_SER_UN_UUID_V_LID'
    ),
  })
  usuarioId?: string;

  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  observacionesResolucion?: string;

  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  marcarComoResuelta?: boolean;

  @IsOptional()
  @IsEnum(EstadoFinalIncidenciaDto, {
    message: i18nValidationMessage('validation.INVALID_ENUM'),
  })
  estadoFinal?: EstadoFinalIncidenciaDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResolverIncidenciaLineaDto)
  lineas?: ResolverIncidenciaLineaDto[];
}
