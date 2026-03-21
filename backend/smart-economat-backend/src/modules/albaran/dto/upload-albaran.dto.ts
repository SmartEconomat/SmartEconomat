import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { TrimStringTransformer } from '../../../common/transformers/trim-string.transformer';

/**
 * DTO para la subida de un documento de albarán (foto o PDF).
 *
 * El archivo se envía como multipart/form-data con el campo 'file'.
 * El DTO valida los metadatos que acompañan al archivo.
 */
export class UploadAlbaranDto {
  @ApiProperty({
    description: 'Número de referencia del albarán físico.',
    example: 'ALB-2026-0042',
  })
  @IsString()
  @IsNotEmpty({ message: 'El número de referencia es obligatorio' })
  @Transform((params) => TrimStringTransformer.transform(params))
  numeroReferencia!: string;

  @ApiPropertyOptional({
    description:
      'ID de la recepción a la que se vincula el albarán. Si no se envía, se vincula al albarán existente por referencia.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('all', { message: 'El ID de recepción debe ser un UUID válido' })
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
