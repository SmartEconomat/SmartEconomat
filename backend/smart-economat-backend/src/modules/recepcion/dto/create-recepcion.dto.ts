import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRecepcionDto {
  @IsUUID()
  idUsuarioReceptor!: string;

  @IsOptional()
  @IsDateString()
  fechaRecepcion?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
