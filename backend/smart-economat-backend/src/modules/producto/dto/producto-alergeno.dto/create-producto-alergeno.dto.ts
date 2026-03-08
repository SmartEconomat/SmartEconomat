import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { Alergeno } from '../../enums/producto.enums';

export class CreateProductoAlergenoDto {
  @IsUUID('7', { message: 'El id del producto debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El id del producto es obligatorio' })
  idProducto: string;

  @IsEnum(Alergeno, { message: 'El alérgeno indicado no es válido' })
  @IsNotEmpty({ message: 'El alérgeno es obligatorio' })
  alergeno: Alergeno;
}
