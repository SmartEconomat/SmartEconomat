import {
  IsUUID,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EjecutarProduccionDto {
  @ApiProperty({ description: 'UUID de la receta a producir' })
  @IsUUID()
  recetaId!: string;

  @ApiProperty({ description: 'Cantidad total a producir' })
  @IsNumber()
  @Min(0.001)
  cantidadProducida!: number;

  @ApiPropertyOptional({
    description: 'Fecha de caducidad manual del lote producido (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  fechaCaducidadManual?: string;

  @ApiProperty({
    description:
      'UUID de la ubicación de almacén destino para el lote producido',
  })
  @IsUUID()
  ubicacionDestinoId!: string;
}
