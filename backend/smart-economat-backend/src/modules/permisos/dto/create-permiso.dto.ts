import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermisoDto {
  @ApiProperty({
    description: 'Código único del permiso (formato: modulo:accion)',
    example: 'usuarios:listar',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z_]+:[a-z_]+$/, {
    message:
      'El código debe tener el formato "modulo:accion" (solo minúsculas y guiones bajos)',
  })
  codigo!: string;

  @ApiProperty({
    description: 'Nombre legible del permiso',
    example: 'Listar usuarios',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre!: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del permiso',
    example: 'Permite ver el listado completo de usuarios del sistema',
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    description: 'Módulo o recurso al que pertenece',
    example: 'usuarios',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  modulo!: string;

  @ApiProperty({
    description: 'Acción que representa el permiso',
    example: 'listar',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  accion!: string;

  @ApiPropertyOptional({
    description: 'Estado del permiso',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
