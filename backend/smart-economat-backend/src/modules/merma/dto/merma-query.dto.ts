import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { MotivoMerma } from '../enums/merma.enums';

/** Query DTO para listado paginado de mermas con filtros opcionales. */
export class MermaQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: MotivoMerma })
  @IsOptional()
  @IsEnum(MotivoMerma)
  motivo?: MotivoMerma;

  @ApiPropertyOptional({
    description: 'Fecha inicial ISO-8601 (filtro por created_at)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description:
      'Fecha final ISO-8601 (filtro por created_at, inclusive fin de día)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
