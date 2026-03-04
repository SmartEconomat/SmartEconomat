import { ApiProperty } from '@nestjs/swagger';
import { Receta } from '../receta.entity/receta.entity';
import { AlergenoProducto } from '../../producto/enums/producto.enums';

export class IngredienteDetalleDto {
  @ApiProperty()
  cantidadNecesaria!: number;

  @ApiProperty()
  stockActual!: number;

  @ApiProperty()
  cantidadFaltante!: number;

  @ApiProperty()
  unidad!: string;

  @ApiProperty()
  productoId!: string;

  @ApiProperty()
  productoNombre!: string;
}

export class DetalleRecetaDto {
  @ApiProperty({ type: () => Receta })
  receta!: Receta;

  @ApiProperty({ type: [IngredienteDetalleDto] })
  detalleIngredientes!: IngredienteDetalleDto[];

  @ApiProperty({ type: [String] })
  alergenosConsolidados!: AlergenoProducto[];
}
