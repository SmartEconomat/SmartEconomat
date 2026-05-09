import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Clase pública (UpdatePlantillaPermisosDto). Paquete: smart-economat-backend (Nest). */
export class UpdatePlantillaPermisosDto {
  @ApiProperty({
    description: 'IDs de permisos a asignar a la plantilla',
    type: [String],
  })
  @IsArray()
  @IsUUID('7', { each: true })
  permisoIds!: string[];
}
