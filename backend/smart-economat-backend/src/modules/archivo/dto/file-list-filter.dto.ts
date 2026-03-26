import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class FileListFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'docs.FILTRAR_POR_ID_DE_USUARIO' })
  @IsOptional()
  @IsUUID('7')
  declare usuarioId?: string;

  @ApiPropertyOptional({
    description: 'docs.FILTRAR_POR_TIPO_MIME_EJ_IMAGE_PNG',
  })
  @IsOptional()
  @IsString()
  mimeType?: string;
}
