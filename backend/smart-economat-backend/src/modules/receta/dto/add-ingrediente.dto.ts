import {
  IsUUID,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UnidadIngrediente } from '../enums/receta.enums';

export class AddIngredienteDto {
  @IsUUID('7')
  productoId!: string;

  @IsNumber()
  @Min(0.01)
  cantidad!: number;

  @IsEnum(UnidadIngrediente)
  unidad!: UnidadIngrediente;

  @ApiPropertyOptional({
    description: 'docs.PORCENTAJE_DE_MERMA_0_99_EJ_20_20_DE_P_R',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99)
  mermaAplicada?: number;
}
