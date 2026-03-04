import { IsUUID, IsNumber, Min, IsEnum } from 'class-validator';
import { UnidadIngrediente } from '../enums/receta.enums';

export class AddIngredienteDto {
  @IsUUID()
  productoId!: string;

  @IsNumber()
  @Min(0.01)
  cantidad!: number;

  @IsEnum(UnidadIngrediente)
  unidad!: UnidadIngrediente;
}
