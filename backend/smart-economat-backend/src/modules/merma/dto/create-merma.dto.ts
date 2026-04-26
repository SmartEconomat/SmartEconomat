import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MotivoMerma, TipoMerma } from '../enums/merma.enums';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateMermaDto {
  @ApiProperty({ description: 'UUID del producto al que se registra la merma' })
  @IsUUID('all')
  productoId!: string;

  @ApiProperty({
    description:
      'Cantidad descontada del inventario (en la unidad base del producto)',
    minimum: 0.001,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  cantidad!: number;

  @ApiProperty({ enum: MotivoMerma, description: 'Motivo de la merma' })
  @IsEnum(MotivoMerma)
  motivo!: MotivoMerma;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales sobre la merma',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notas?: string;

  @ApiPropertyOptional({
    enum: TipoMerma,
    description:
      'Tipología operacional de la merma para analítica y trazabilidad',
  })
  @IsOptional()
  @IsEnum(TipoMerma)
  tipo?: TipoMerma;

  @ApiPropertyOptional({
    description:
      'Entidad de origen para trazabilidad (por ejemplo: Recepcion, ProduccionLote, AjusteInventario)',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Za-z][A-Za-z0-9_]*$/, {
    message: i18nValidationMessage('validation.ORIGEN_ENTIDAD_SNAKE_CASE'),
  })
  origenEntidad?: string;

  @ApiPropertyOptional({
    description: 'UUID de la entidad de origen para trazabilidad del evento',
  })
  @IsOptional()
  @IsUUID('all')
  origenId?: string;

  @ApiPropertyOptional({
    description:
      'UUID de referencia secundaria (por ejemplo, línea operativa o recurso relacionado)',
  })
  @IsOptional()
  @IsUUID('all')
  referenciaId?: string;

  @ApiPropertyOptional({
    description:
      'Clave de idempotencia opcional para prevenir doble aplicación por reintentos',
  })
  @IsOptional()
  @IsUUID('all')
  idempotencyKey?: string;
}
