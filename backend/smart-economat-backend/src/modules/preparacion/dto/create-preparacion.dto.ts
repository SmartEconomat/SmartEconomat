import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePreparacionDto {
  @ApiProperty({
    description:
      'Referencia obligatoria a una receta existente. La preparación siempre hereda de esta receta el producto final a generar, sin duplicarlo en el payload.',
    format: 'uuid',
  })
  @IsUUID()
  recetaId: string;

  @ApiProperty({
    description: 'Cantidad total a producir al ejecutar la receta asociada.',
    example: 2.5,
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  cantidadAProducir: number;

  @ApiPropertyOptional({
    description:
      'Fecha programada opcional para la ejecución de la preparación.',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  fechaProgramada?: string;

  @ApiPropertyOptional({
    description:
      'Ubicación de destino del resultado de la preparación. Si se informa, se usa al finalizar la ejecución.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('7')
  ubicacionDestinoId?: string;

  @ApiPropertyOptional({
    description:
      'Notas operativas de la ejecución. No debe duplicar ingredientes, pasos, tiempos ni el producto final de la receta.',
    example:
      'Preparar con fuego medio y revisar punto de sal antes de finalizar.',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
