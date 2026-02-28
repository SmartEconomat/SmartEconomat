import { ApiProperty } from '@nestjs/swagger';
import {
  TipoDiferencia,
  EstadoReclamacion,
} from '../incidencia-linea.entity/incidencia-linea.entity';

export class IncidenciaLineaDto {
  @ApiProperty({ description: 'ID de la línea de incidencia' })
  id!: string;

  @ApiProperty({ description: 'Cantidad pedida originalmente al proveedor' })
  cantidadEsperada!: number;

  @ApiProperty({ description: 'Cantidad escaneada/recibida realmente' })
  cantidadRecibida!: number;

  @ApiProperty({ description: 'Diferencia de cantidades' })
  diferencia!: number;

  @ApiProperty({ enum: TipoDiferencia })
  tipoDiferencia!: TipoDiferencia;

  @ApiProperty({ enum: EstadoReclamacion })
  estadoReclamacion!: EstadoReclamacion;

  @ApiProperty({
    description: 'Observaciones para esta línea en particular',
    required: false,
  })
  observaciones?: string;

  @ApiProperty({ description: 'ID del producto pedido', required: false })
  pedidoProductoId?: string;

  @ApiProperty({ description: 'Nombre del producto', required: false })
  nombreProducto?: string;
}
