import { IsNumber, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePrecioProductoDto {
  @ApiProperty({
    description: 'Nuevo precio unitario del producto del proveedor',
    example: 10.5,
  })
  @IsNumber({}, { message: 'El precio debe ser un número válido' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  @IsNotEmpty({ message: 'El precio es obligatorio' })
  nuevoPrecio: number;
}
