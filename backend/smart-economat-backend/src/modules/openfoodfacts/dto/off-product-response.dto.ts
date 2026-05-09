import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Clase pública (OffProductResponseDto). Paquete: smart-economat-backend (Nest). */
export class OffProductResponseDto {
  @ApiProperty({ description: 'Nombre principal del producto' })
  name!: string;

  @ApiPropertyOptional({ description: 'Marca principal del producto' })
  brand?: string;

  @ApiPropertyOptional({ description: 'Descripción genérica del producto' })
  description?: string;

  @ApiPropertyOptional({ description: 'Unidad de medida normalizada' })
  uom?: string;

  @ApiPropertyOptional({ description: 'Cantidad numérica detectada' })
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Alérgenos mapeados al catálogo interno',
    type: [String],
  })
  allergens?: string[];

  @ApiPropertyOptional({ description: 'URL de imagen del producto' })
  imageUrl?: string;
}
