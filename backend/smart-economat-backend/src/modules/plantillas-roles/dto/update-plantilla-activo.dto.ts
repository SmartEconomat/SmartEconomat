import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/** Clase pública (UpdatePlantillaActivoDto). Paquete: smart-economat-backend (Nest). */
export class UpdatePlantillaActivoDto {
  @ApiProperty({
    description: 'Estado activo/inactivo de la plantilla',
    example: false,
  })
  @IsBoolean()
  activo!: boolean;
}
