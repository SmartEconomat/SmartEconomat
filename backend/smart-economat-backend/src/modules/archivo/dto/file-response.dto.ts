import { ApiProperty } from '@nestjs/swagger';

export class FileResponseDto {
  @ApiProperty({ description: 'docs.ID_NICO_DEL_ARCHIVO', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'docs.NOMBRE_ORIGINAL_DEL_ARCHIVO' })
  nombre: string;

  @ApiProperty({ description: 'docs.URL_PARA_ACCEDER_AL_ARCHIVO' })
  url: string;

  @ApiProperty({ description: 'docs.TAMA_O_DEL_ARCHIVO_EN_BYTES' })
  tamano: number;

  @ApiProperty({ description: 'docs.TIPO_MIME_DEL_ARCHIVO' })
  mimeType: string;

  @ApiProperty({ description: 'docs.FECHA_DE_SUBIDA_DEL_ARCHIVO' })
  fechaSubida: Date;

  @ApiProperty({
    description: 'docs.INFORMACI_N_B_SICA_DEL_USUARIO_QUE_SUBI',
    required: false,
  })
  subidoPor?: {
    id: string;
    nombre: string;
    username: string;
  };
}
