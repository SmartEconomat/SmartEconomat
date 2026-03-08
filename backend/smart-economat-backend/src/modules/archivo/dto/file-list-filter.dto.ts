import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class FileListFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por ID de Usuario' })
  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por tipo MIME (ej. image/png)' })
  @IsOptional()
  @IsString()
  mimeType?: string;
}
