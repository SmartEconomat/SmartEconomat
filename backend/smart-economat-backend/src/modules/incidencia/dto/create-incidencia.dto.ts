import { i18nValidationMessage } from 'nestjs-i18n';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';
import { TipoResolucion } from '../enums/incidencia.enums';
import { TipoDiferencia } from '../incidencia-linea.entity/incidencia-linea.entity';

export class CreateIncidenciaLineaDto {
  @IsUUID('all', {
    message: i18nValidationMessage('validation.INVALID_UUID'),
  })
  pedidoProductoId!: string;

  @Type(() => Number)
  @IsNumber({}, { message: i18nValidationMessage('validation.INVALID_NUMBER') })
  @Min(0, { message: i18nValidationMessage('validation.INVALID_MIN') })
  cantidadEsperada!: number;

  @Type(() => Number)
  @IsNumber({}, { message: i18nValidationMessage('validation.INVALID_NUMBER') })
  @Min(0, { message: i18nValidationMessage('validation.INVALID_MIN') })
  cantidadRecibida!: number;

  @IsEnum(TipoDiferencia, {
    message: i18nValidationMessage('validation.INVALID_ENUM'),
  })
  tipoDiferencia!: TipoDiferencia;

  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  observaciones?: string;
}

export class CreateIncidenciaDto {
  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DE_LA_RECEPCI_N_DEBE_SER_UN_UUID_V'
    ),
  })
  recepcionId: string;

  @IsOptional()
  @IsUUID('all')
  pedidoId?: string;

  @Transform((params) => TrimStringTransformer.transform(params))
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  @IsString()
  observacionesRecepcion!: string;

  @IsArray({ message: i18nValidationMessage('validation.INVALID_ARRAY') })
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.REQUIRED'),
  })
  @ValidateNested({ each: true })
  @Type(() => CreateIncidenciaLineaDto)
  lineas!: CreateIncidenciaLineaDto[];

  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  motivo?: string;
}

export class CreateIncidenciaResuelaDto {
  @IsUUID('all', {
    message: i18nValidationMessage(
      'validation.EL_ID_DE_LA_INCIDENCIA_DEBE_SER_UN_UUID'
    ),
  })
  idIncidencia!: string;

  @IsUUID('all')
  idUsuarioResolutor!: string;

  @IsEnum(TipoResolucion)
  tipoResolucion!: TipoResolucion;

  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  observaciones?: string;
}
