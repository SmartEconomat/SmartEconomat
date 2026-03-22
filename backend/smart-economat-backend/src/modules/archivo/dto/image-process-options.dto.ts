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
      'Formato de salida final. El backend genera WebP como formato estándar optimizado.',
    required: false,
    default: 'webp',
  })
  @IsOptional()
  @IsString()
  formatoSalida?: 'jpeg' | 'jpg' | 'webp' | 'png' = 'webp';

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
