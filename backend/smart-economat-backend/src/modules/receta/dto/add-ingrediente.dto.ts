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
  @IsUUID()
  productoId!: string;

  @IsNumber()
  @Min(0.01)
  cantidad!: number;

  @IsEnum(UnidadIngrediente)
  unidad!: UnidadIngrediente;

  @ApiPropertyOptional({
    description:
      'Porcentaje de merma (0-99). Ej: 20 = 20% de pérdida en limpieza.',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99)
  mermaAplicada?: number;
}
