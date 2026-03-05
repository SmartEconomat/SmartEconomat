import { IsArray, IsEnum, ArrayNotEmpty } from 'class-validator';
import { Alergeno } from '../../enums/producto.enums';

export class UpdateProductoAlergenoDto {
  @IsArray({ message: 'Los alérgenos deben ser un array' })
  @ArrayNotEmpty({ message: 'La lista de alérgenos no puede estar vacía' })
  @IsEnum(Alergeno, {
    each: true,
    message: 'Uno o más alérgenos indicados no son válidos',
  })
  alergenos: Alergeno[];
}
