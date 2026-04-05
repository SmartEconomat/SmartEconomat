import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdatePlantillaActivoDto {
  @ApiProperty({
    description: 'Estado activo/inactivo de la plantilla',
    example: false,
  })
  @IsBoolean()
  activo!: boolean;
}
