import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** DTO de respuesta para GET /usuarios/perfil — excluye campos sensibles (password, OTP, hashes). */
export class PerfilResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional()
  nombre?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiProperty()
  rol: string;

  @ApiPropertyOptional()
  idioma?: string;

  @ApiProperty()
  activo: boolean;

  @ApiProperty()
  status: string;

  @ApiProperty()
  mustChangePassword: boolean;

  @ApiPropertyOptional()
  ubicacionId?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Relaciones cargadas (ubicación, roles, etc.)',
  })
  ubicacion?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [Object] })
  roles?: Record<string, unknown>[];

  @ApiPropertyOptional({ type: [Object] })
  permisosAdicionales?: Record<string, unknown>[];

  @ApiPropertyOptional({ type: [Object] })
  permisosExcluidos?: Record<string, unknown>[];

  @ApiProperty({ type: [String] })
  permisos: string[];

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}
