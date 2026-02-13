import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateRecepcionDto {
  @IsOptional()
  @IsDateString()
  fechaRecepcion?: Date;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsInt()
  usuarioId: string;
}
