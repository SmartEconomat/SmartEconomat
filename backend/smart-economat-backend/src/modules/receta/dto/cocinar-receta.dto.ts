import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class CocinarRecetaDto {
  @ApiPropertyOptional({
    description: 'Cantidad de porciones/veces a elaborar de esta receta',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  cantidad?: number;
}
