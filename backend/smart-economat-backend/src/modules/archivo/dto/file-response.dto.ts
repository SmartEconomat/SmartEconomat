import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FileUserInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  username: string;
}

export class FileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  tamano: number;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  fechaSubida: Date;

  @ApiPropertyOptional()
  subidoPor?: FileUserInfo;
}
