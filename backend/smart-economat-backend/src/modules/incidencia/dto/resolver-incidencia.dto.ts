import { IsUUID, IsOptional, IsString } from 'class-validator';

export class ResolverIncidenciaDto {
  @IsUUID('all', { message: 'El ID del usuario debe ser un UUID válido' })
  usuarioId!: string;

  @IsOptional()
  @IsString()
  observacionesResolucion?: string;
}
