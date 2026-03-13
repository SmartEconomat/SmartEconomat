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
    description: 'docs.C_DIGO_NICO_DEL_PERMISO_FORMATO_MODULO_A',
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
    description: 'docs.NOMBRE_LEGIBLE_DEL_PERMISO',
    example: 'Listar usuarios',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre!: string;

  @ApiPropertyOptional({
    description: 'docs.DESCRIPCI_N_DETALLADA_DEL_PERMISO',
    example: 'Permite ver el listado completo de usuarios del sistema',
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    description: 'docs.M_DULO_O_RECURSO_AL_QUE_PERTENECE',
    example: 'usuarios',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  modulo!: string;

  @ApiProperty({
    description: 'docs.ACCI_N_QUE_REPRESENTA_EL_PERMISO',
    example: 'listar',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  accion!: string;

  @ApiPropertyOptional({
    description: 'docs.ESTADO_DEL_PERMISO',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
