import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';

/**
 * Documentación en español.
 */
export class UploadAlbaranDto {
  @ApiProperty({
    description: 'Número de referencia del albarán físico.',
    example: 'ALB-2026-0042',
  })
  @IsString()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NUMERO_REFERENCIA_OBLIGATORIO'),
  })
  @Transform((params) => TrimStringTransformer.transform(params))
  numeroReferencia!: string;

  @ApiPropertyOptional({
    description:
      'ID de la recepción a la que se vincula el albarán. Si no se envía, se vincula al albarán existente por referencia.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('all', {
    message: i18nValidationMessage('validation.RECEPCION_ID_UUID_INVALIDO'),
  })
  recepcionId?: string;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales sobre el documento',
    example: 'Foto del albarán firmado por el transportista',
  })
  @IsOptional()
  @IsString()
  @Transform((params) => TrimStringTransformer.transform(params))
  observaciones?: string;
}
