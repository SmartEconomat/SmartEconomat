import { ApiProperty } from '@nestjs/swagger';

export class FileResponseDto {
  @ApiProperty({ description: 'ID único del archivo', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Nombre original del archivo' })
  nombre: string;

  @ApiProperty({ description: 'URL para acceder al archivo' })
  url: string;

  @ApiProperty({ description: 'Tamaño del archivo en bytes' })
  tamano: number;

  @ApiProperty({ description: 'Tipo MIME del archivo' })
  mimeType: string;

  @ApiProperty({ description: 'Fecha de subida del archivo' })
  fechaSubida: Date;

  @ApiProperty({
    description: 'Información básica del usuario que subió el archivo',
    required: false,
  })
  subidoPor?: {
    id: string;
    nombre: string;
    username: string;
  };
}
