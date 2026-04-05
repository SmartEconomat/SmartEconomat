import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePlantillaPermisosDto {
  @ApiProperty({
    description: 'IDs de permisos a asignar a la plantilla',
    type: [String],
  })
  @IsArray()
  @IsUUID('7', { each: true })
  permisoIds!: string[];
}
