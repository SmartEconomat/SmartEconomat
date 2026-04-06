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

export class EjecutarProduccionDto {
  @ApiProperty({ description: 'docs.UUID_DE_LA_RECETA_A_PRODUCIR' })
  @IsUUID('all')
  recetaId!: string;

  @ApiProperty({ description: 'docs.CANTIDAD_TOTAL_A_PRODUCIR' })
  @Transform((params) => StringToNumberTransformer.transform(params))
  @IsNumber()
  @Min(0.001)
  cantidadProducida!: number;

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
}
