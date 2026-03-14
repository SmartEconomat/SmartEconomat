import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  IsString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class ImageProcessOptionsDto {
  @ApiProperty({
    description: 'Ancho máximo de la imagen',
    required: false,
    default: 1200,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  ancho?: number = 1200;

  @ApiProperty({
    description: 'Alto máximo de la imagen',
    required: false,
    default: 1200,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  alto?: number = 1200;

  @ApiProperty({
    description:
      'Formato de salida (jpeg, jpg, png). Si se envía webp, se normaliza a jpeg por compatibilidad multiplataforma',
    required: false,
    default: 'jpeg',
  })
  @IsOptional()
  @IsString()
  formatoSalida?: 'jpeg' | 'jpg' | 'webp' | 'png' = 'jpeg';

  @ApiProperty({
    description: 'Calidad de compresión (1-100)',
    required: false,
    default: 80,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  calidad?: number = 80;

  @ApiProperty({
    description: 'Mantener proporción de aspecto',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  mantenerAspectRatio?: boolean = true;
}
