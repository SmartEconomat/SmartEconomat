import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { MotivoMerma } from '../enums/merma.enums';

/** Query opcional para estadísticas agregadas de mermas (ventana temporal). */
export class MermaStatsQueryDto {
  @ApiPropertyOptional({
    description:
      'Fecha inicial ISO-8601. Si se omiten ambas fechas, el backend usa los últimos 90 días.',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description:
      'Fecha final ISO-8601. Si se omiten ambas fechas, el backend usa los últimos 90 días.',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: MotivoMerma,
    description: 'Motivo opcional para segmentar las estadísticas de merma',
  })
  @IsOptional()
  @IsEnum(MotivoMerma)
  motivo?: MotivoMerma;
}
