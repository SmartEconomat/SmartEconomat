import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/** Clase pública (MermaKpiQueryDto). Paquete: smart-economat-backend (Nest). */
export class MermaKpiQueryDto {
  @ApiPropertyOptional({
    description: 'Fecha inicial ISO-8601 para ventana analítica',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha final ISO-8601 para ventana analítica',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filtrar KPIs por producto',
  })
  @IsOptional()
  @IsUUID('all')
  productoId?: string;
}
