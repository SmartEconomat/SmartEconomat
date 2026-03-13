import { IsArray, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'docs.IDS_DE_LOS_PERMISOS_A_ASIGNAR_AL_ROL',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  @IsArray()
  @IsUUID('7', { each: true })
  @IsNotEmpty()
  permisoIds!: string[];
}
