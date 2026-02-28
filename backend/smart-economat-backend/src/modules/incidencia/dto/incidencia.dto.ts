import { ApiProperty } from '@nestjs/swagger';
import { IncidenciaLineaDto } from './incidencia-linea.dto';

export class IncidenciaDto {
  @ApiProperty({ description: 'ID de la incidencia' })
  id!: string;

  @ApiProperty({ description: 'ID de la recepción donde se detectó' })
  recepcionId!: string;

  @ApiProperty({ description: 'ID del pedido (proveedor) al que pertenece' })
  pedidoId!: string;

  @ApiProperty({
    description: 'Nombre o identificador del proveedor',
    required: false,
  })
  proveedorNombre?: string;

  @ApiProperty({
    description: 'Observaciones generales al momento de la recepción',
    required: false,
  })
  observacionesRecepcion?: string;

  @ApiProperty({
    description: 'Observaciones añadidas a la hora de resolver',
    required: false,
  })
  observacionesResolucion?: string;

  @ApiProperty({ description: 'Si la incidencia está resuelta o no' })
  resuelta!: boolean;

  @ApiProperty({ description: 'Fecha en la que fue resuelta', required: false })
  fechaResolucion?: Date;

  @ApiProperty({
    type: [IncidenciaLineaDto],
    description: 'Líneas con discrepancias',
  })
  lineas!: IncidenciaLineaDto[];
}
