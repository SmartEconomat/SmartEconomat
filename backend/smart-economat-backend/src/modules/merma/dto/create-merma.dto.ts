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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MotivoMerma } from '../enums/merma.enums';

export class CreateMermaDto {
  @ApiProperty({ description: 'UUID del producto al que se registra la merma' })
  @IsUUID('7')
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
}
