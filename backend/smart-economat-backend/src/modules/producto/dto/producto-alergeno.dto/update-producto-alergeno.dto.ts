import { IsArray, IsEnum, ArrayNotEmpty } from 'class-validator';
import { AlergenoProducto } from '../../enums/producto.enums';

export class UpdateProductoAlergenoDto {
  @IsArray({ message: 'Los alérgenos deben ser un array' })
  @ArrayNotEmpty({ message: 'La lista de alérgenos no puede estar vacía' })
  @IsEnum(AlergenoProducto, {
    each: true,
    message: 'Uno o más alérgenos indicados no son válidos',
  })
  alergenos: AlergenoProducto[];
}
