import {
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoDiferencia } from '../../incidencia/incidencia-linea.entity/incidencia-linea.entity';

export enum TipoReportePdf {
  PEDIDO = 'pedido',
  INCIDENCIAS = 'incidencias',
  RECEPCION = 'recepcion',
}

export class RecepcionReportePdfDto {
  @IsOptional()
  @IsEnum(TipoReportePdf)
  tipo?: TipoReportePdf;

  @IsOptional()
  @IsUUID('all')
  pedidoId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID('all')
  proveedorId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  soloNoResueltas?: boolean;

  @IsOptional()
  @IsEnum(TipoDiferencia)
  tipoDiferencia?: TipoDiferencia;

  @IsOptional()
  @IsUUID('all')
  batchId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === '1') return true;
    return false;
  })
  incluirCancelados?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === '1') return true;
    return false;
  })
  paginaPorProveedor?: boolean;

  @IsOptional()
  @IsUUID('all')
  recepcionId?: string;
}
