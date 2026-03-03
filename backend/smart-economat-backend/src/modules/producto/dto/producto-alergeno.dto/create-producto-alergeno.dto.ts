import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { AlergenoProducto } from '../../enums/producto.enums';

export class CreateProductoAlergenoDto {
  @IsUUID('4', { message: 'El id del producto debe ser un UUID v4 válido' })
  @IsNotEmpty({ message: 'El id del producto es obligatorio' })
  idProducto: string;

  @IsEnum(AlergenoProducto, { message: 'El alérgeno indicado no es válido' })
  @IsNotEmpty({ message: 'El alérgeno es obligatorio' })
  alergeno: AlergenoProducto;
}
