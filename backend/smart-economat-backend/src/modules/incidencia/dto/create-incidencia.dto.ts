import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';
import { TipoResolucion } from '../enums/incidencia.enums';

export class CreateIncidenciaDto {
  @IsUUID('7', { message: 'El ID de la recepción debe ser un UUID válido' })
  recepcionId: string;

  @IsOptional()
  @IsUUID('7')
  pedidoId?: string;

  @IsOptional()
  @IsString()
  observacionesRecepcion?: string;
}

export class CreateIncidenciaResuelaDto {
  @IsUUID('7', { message: 'El ID de la incidencia debe ser un UUID válido' })
  idIncidencia!: string;

  @IsOptional()
  @IsUUID('7')
  idUsuarioResolutor?: string;

  @IsOptional()
  @IsEnum(TipoResolucion)
  tipoResolucion?: TipoResolucion;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
