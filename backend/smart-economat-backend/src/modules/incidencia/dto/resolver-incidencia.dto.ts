import { IsUUID, IsOptional, IsString } from 'class-validator';

export class ResolverIncidenciaDto {
  @IsOptional()
  @IsUUID('7', { message: 'El ID del usuario debe ser un UUID válido' })
  usuarioId?: string;

  @IsOptional()
  @IsString()
  observacionesResolucion?: string;
}
