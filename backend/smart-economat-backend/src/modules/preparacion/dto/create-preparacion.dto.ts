import { IsUUID, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPortion } from '../../../common/decorators/is-portion.decorator';

/** Clase pública (CreatePreparacionDto). Paquete: smart-economat-backend (Nest). */
export class CreatePreparacionDto {
  @ApiProperty({
    description:
      'Referencia obligatoria a una receta existente. La preparación siempre hereda de esta receta el producto final a generar, sin duplicarlo en el payload.',
    format: 'uuid',
  })
  @IsUUID()
  recetaId: string;

  @ApiProperty({
    description:
      'Porciones a producir (múltiplos de 0,5): escala objetivo como en una preparación. El backend deriva cantidad física y consumo de ingredientes.',
    example: 2.5,
  })
  @IsPortion()
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
  @IsUUID('all')
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
