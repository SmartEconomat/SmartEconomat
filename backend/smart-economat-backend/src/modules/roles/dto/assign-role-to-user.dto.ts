import { IsUUID, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignRoleToUserDto {
  @ApiProperty({
    description: 'ID del usuario al que se asignará el rol',
    example: 'uuid-usuario',
  })
  @IsUUID('7')
  @IsNotEmpty()
  usuarioId!: string;

  @ApiProperty({
    description: 'ID del rol a asignar',
    example: 'uuid-rol',
  })
  @IsUUID('7')
  @IsNotEmpty()
  rolId!: string;

  @ApiPropertyOptional({
    description: 'Estado de la asignación',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
