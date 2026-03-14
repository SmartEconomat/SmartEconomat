import {
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoDiferencia } from '../../incidencia/incidencia-linea.entity/incidencia-linea.entity';

export enum TipoReportePdf {
  PEDIDO = 'pedido',
  INCIDENCIAS = 'incidencias',
}

export class RecepcionReportePdfDto {
  @IsEnum(TipoReportePdf)
  tipo!: TipoReportePdf;

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
  @Type(() => Boolean)
  soloNoResueltas?: boolean;

  @IsOptional()
  @IsEnum(TipoDiferencia)
  tipoDiferencia?: TipoDiferencia;
}
