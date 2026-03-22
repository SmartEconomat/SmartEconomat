import { ApiProperty } from '@nestjs/swagger';
import { FileResponseDto } from './file-response.dto';

export class ProcessedFileResponseDto extends FileResponseDto {
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
