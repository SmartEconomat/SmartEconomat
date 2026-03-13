import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class CocinarRecetaDto {
  @ApiPropertyOptional({
    description: 'docs.CANTIDAD_DE_PORCIONES_VECES_A_ELABORAR_D',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  cantidad?: number;
}
