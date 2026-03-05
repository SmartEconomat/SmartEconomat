import { ApiProperty } from '@nestjs/swagger';
import { UnidadIngrediente } from '../enums/receta.enums';

export class IngredienteCostoDto {
  @ApiProperty()
  productoId!: string;

  @ApiProperty()
  productoNombre!: string;

  @ApiProperty()
  cantidad!: number;

  @ApiProperty({ enum: UnidadIngrediente })
  unidad!: UnidadIngrediente;

  @ApiProperty()
  precioUnitario!: number;

  @ApiProperty()
  costoIngrediente!: number;
}

export class RecetaCostResponseDto {
  @ApiProperty()
  recetaId!: string;

  @ApiProperty()
  recetaNombre!: string;

  @ApiProperty()
  costoTotal!: number;

  @ApiProperty({ type: [IngredienteCostoDto] })
  desglosePorIngrediente!: IngredienteCostoDto[];
}
