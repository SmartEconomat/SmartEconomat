import { ApiProperty } from '@nestjs/swagger';
import { Receta } from '../receta.entity/receta.entity';
import { Alergeno } from '../../producto/enums/producto.enums';

/** Clase pública (IngredienteDetalleDto). Paquete: smart-economat-backend (Nest). */
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

/** Clase pública (DetalleRecetaDto). Paquete: smart-economat-backend (Nest). */
export class DetalleRecetaDto {
  @ApiProperty({ type: () => Receta })
  receta!: Receta;

  @ApiProperty({ type: [IngredienteDetalleDto] })
  detalleIngredientes!: IngredienteDetalleDto[];

  @ApiProperty({ type: [String] })
  alergenosConsolidados!: Alergeno[];
}
