import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { MotivoMerma } from '../enums/merma.enums';

/** Clase pública (CreateMermaProduccionDto). Paquete: smart-economat-backend (Nest). */
export class CreateMermaProduccionDto {
  @ApiProperty({
    description: 'UUID del lote de producción al que se asocia la merma',
  })
  @IsUUID('all')
  produccionLoteId!: string;

  @ApiProperty({
    description:
      'UUID del producto ingrediente usado en la preparación que sufre la merma',
  })
  @IsUUID('all')
  productoId!: string;

  @ApiProperty({
    description:
      'Cantidad perdida del ingrediente (en la unidad base del producto)',
    minimum: 0.001,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  cantidad!: number;

  @ApiPropertyOptional({
    enum: MotivoMerma,
    description:
      'Motivo de la merma (por defecto error_preparacion cuando no se envía)',
    default: MotivoMerma.ERROR_PREPARACION,
  })
  @IsOptional()
  @IsEnum(MotivoMerma)
  motivo?: MotivoMerma;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales sobre la merma de producción',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notas?: string;

  @ApiPropertyOptional({
    description:
      'UUID del inventario concreto del ingrediente sobre el que se registra la merma',
  })
  @IsOptional()
  @IsUUID('all')
  inventarioId?: string;

  @ApiPropertyOptional({
    description:
      'UUID de ubicación para acotar el descuento de stock del ingrediente en la merma',
  })
  @IsOptional()
  @IsUUID('all')
  ubicacionId?: string;

  @ApiPropertyOptional({
    description:
      'Clave de idempotencia opcional para prevenir doble aplicación por reintentos',
  })
  @IsOptional()
  @IsUUID('all')
  idempotencyKey?: string;
}
