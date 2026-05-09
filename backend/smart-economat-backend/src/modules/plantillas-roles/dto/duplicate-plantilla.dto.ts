import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Clase pública (DuplicatePlantillaDto). Paquete: smart-economat-backend (Nest). */
export class DuplicatePlantillaDto {
  @ApiPropertyOptional({
    description: 'Nombre opcional para la nueva plantilla duplicada',
    example: 'ADMIN COPIA',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;
}
