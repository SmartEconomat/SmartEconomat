import { ApiProperty } from '@nestjs/swagger';
import { FileResponseDto } from './file-response.dto';

export class ProcessedFileResponseDto extends FileResponseDto {
  @ApiProperty({ description: 'URL de la versión optimizada', required: false })
  urlOptimized?: string;

  @ApiProperty({
    description: 'Tamaño de la versión optimizada en bytes',
    required: false,
  })
  tamanoOptimized?: number;

  @ApiProperty({
    description: 'Tipo MIME de la versión optimizada',
    required: false,
  })
  mimeTypeOptimized?: string;

  @ApiProperty({
    description: 'Tamaño original para comparación',
    required: false,
  })
  originalSize?: number;

  @ApiProperty({
    description: 'Tamaño procesado para comparación',
    required: false,
  })
  processedSize?: number;

  @ApiProperty({ description: 'Formato final de la imagen', required: false })
  formatoFinal?: string;
}
