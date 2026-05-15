import {
  IsUUID,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { StringToNumberTransformer } from '../../../common/transformers/string-to-number.transformer';

/** Clase pública (EjecutarProduccionDto). Paquete: smart-economat-backend (Nest). */
export class EjecutarProduccionDto {
  @ApiProperty({ description: 'docs.UUID_DE_LA_RECETA_A_PRODUCIR' })
  @IsUUID('all')
  recetaId!: string;

  /**
   * Cantidad física total producida (unidad de resultado de la receta).
   * Exclusivo respecto a `cantidadAProducir`.
   */
  @ApiPropertyOptional({ description: 'docs.CANTIDAD_TOTAL_A_PRODUCIR' })
  @IsOptional()
  @Transform((params) => StringToNumberTransformer.transform(params))
  @IsNumber()
  @Min(0.001)
  cantidadProducida?: number;

  /**
   * Factor de escala de cocina (cantidad “a preparar” en el sentido de coeficiente sobre la receta).
   * Decimal permitido. Exclusivo con `cantidadProducida`.
   */
  @ApiPropertyOptional({
    description:
      'Escala de producción (decimal permitido); el backend deriva la cantidad física y el factor de ingredientes.',
  })
  @IsOptional()
  @Transform((params) => StringToNumberTransformer.transform(params))
  @IsNumber()
  @Min(0.001)
  cantidadAProducir?: number;

  @ApiPropertyOptional({
    description: 'docs.FECHA_DE_CADUCIDAD_MANUAL_DEL_LOTE_PRODU',
  })
  @IsOptional()
  @IsDateString()
  fechaCaducidadManual?: string;

  @ApiPropertyOptional({
    description: 'docs.UUID_DE_LA_UBICACI_N_DE_ALMAC_N_DESTINO',
  })
  @IsOptional()
  @IsUUID('all')
  ubicacionDestinoId?: string;

  @ApiProperty({
    description:
      'Clave de idempotencia obligatoria para evitar ejecuciones duplicadas por reintentos',
  })
  @IsUUID('all')
  idempotencyKey!: string;
}
