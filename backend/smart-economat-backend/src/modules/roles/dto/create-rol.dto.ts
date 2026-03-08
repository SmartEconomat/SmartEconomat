import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRolDto {
  @ApiProperty({
    description: 'Nombre único del rol',
    example: 'Administrador de Economato',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del rol',
    example: 'Rol con acceso completo a la gestión del economato',
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Indica si es un rol de sistema (no editable/eliminable)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  esSistema?: boolean;

  @ApiPropertyOptional({
    description: 'Estado del rol',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'IDs de permisos a asignar al rol',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @IsUUID('7', { each: true })
  @IsOptional()
  permisoIds?: string[];
}
