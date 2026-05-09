import { i18nValidationMessage } from 'nestjs-i18n';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';

/** Línea de traslado de stock entre ubicaciones dentro del mismo producto‑proveedor. */
export class TransferenciaInventarioLineaDto {
  @ApiProperty()
  @IsUUID('all', {
    message: i18nValidationMessage('validation.INVALID_UUID_FORMAT'),
  })
  inventarioOrigenId!: string;

  @ApiProperty({ description: 'Ubicación destino del stock' })
  @IsUUID('all', {
    message: i18nValidationMessage('validation.INVALID_UUID_FORMAT'),
  })
  ubicacionDestinoId!: string;

  @ApiProperty({
    minimum: 0.001,
    description: 'Cantidad a mover (≤ saldo disponible del origen)',
  })
  @IsNumber({}, { message: i18nValidationMessage('validation.INVALID_NUMBER') })
  @Min(0.001, {
    message: i18nValidationMessage('validation.VALUE_TOO_LOW'),
  })
  cantidad!: number;
}

/** Payload para ejecutar una transferencia inmediata (ACID). */
export class CrearTransferenciaInventarioDto {
  @ApiPropertyOptional({
    description:
      'Clave opcional anti-duplicados; repite la misma operación si el cliente la reintentó',
  })
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  @MaxLength(128)
  idempotenciaKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform((params) => TrimStringTransformer.transform(params))
  @IsString()
  @MaxLength(1000)
  observaciones?: string;

  @ApiProperty({ type: [TransferenciaInventarioLineaDto] })
  @IsArray()
  @ArrayMinSize(1, {
    message: i18nValidationMessage(
      'validation.EL_LOTE_DEBE_CONTENER_AL_MENOS_UNA_LINEA'
    ),
  })
  @ValidateNested({ each: true })
  @Type(() => TransferenciaInventarioLineaDto)
  lineas!: TransferenciaInventarioLineaDto[];
}
