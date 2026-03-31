import { IsUUID, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignRoleToUserDto {
  @ApiProperty({
    description: 'docs.ID_DEL_USUARIO_AL_QUE_SE_ASIGNAR_EL_ROL',
    example: 'uuid-usuario',
  })
  @IsUUID('all')
  @IsNotEmpty()
  usuarioId!: string;

  @ApiProperty({
    description: 'docs.ID_DEL_ROL_A_ASIGNAR',
    example: 'uuid-rol',
  })
  @IsUUID('all')
  @IsNotEmpty()
  rolId!: string;

  @ApiPropertyOptional({
    description: 'docs.ESTADO_DE_LA_ASIGNACI_N',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
