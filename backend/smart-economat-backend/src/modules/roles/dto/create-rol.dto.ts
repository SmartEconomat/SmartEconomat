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
    description: 'docs.NOMBRE_NICO_DEL_ROL',
    example: 'Administrador de Economato',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @ApiPropertyOptional({
    description: 'docs.DESCRIPCI_N_DETALLADA_DEL_ROL',
    example: 'Rol con acceso completo a la gestión del economato',
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'docs.INDICA_SI_ES_UN_ROL_DE_SISTEMA_NO_EDITAB',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  esSistema?: boolean;

  @ApiPropertyOptional({
    description: 'docs.ESTADO_DEL_ROL',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'docs.IDS_DE_PERMISOS_A_ASIGNAR_AL_ROL',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @IsUUID('7', { each: true })
  @IsOptional()
  permisoIds?: string[];
}
