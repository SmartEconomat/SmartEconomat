import { ApiProperty } from '@nestjs/swagger';
import {
  TipoDiferencia,
  EstadoReclamacion,
  EstadoLineaIncidencia,
} from '../enums/incidencia.enums';

/** Clase pública (IncidenciaLineaDto). Paquete: smart-economat-backend (Nest). */
export class IncidenciaLineaDto {
  @ApiProperty({ description: 'ID de la línea de incidencia' })
  id!: string;

  @ApiProperty({ description: 'Cantidad pedida originalmente' })
  cantidadPedida!: number;

  @ApiProperty({ description: 'Cantidad recibida realmente' })
  cantidadRecibida!: number;

  @ApiProperty({ description: 'Cantidad ajustada tras resolución' })
  cantidadAjustada!: number;

  @ApiProperty({ description: 'Diferencia de cantidades' })
  diferencia!: number;

  @ApiProperty({ enum: TipoDiferencia })
  tipoDiferencia!: TipoDiferencia;

  @ApiProperty({ enum: EstadoLineaIncidencia })
  estado!: EstadoLineaIncidencia;

  @ApiProperty({ description: 'Indica si la línea aún requiere ajustes' })
  necesitaAjuste!: boolean;

  @ApiProperty({ enum: EstadoReclamacion })
  estadoReclamacion!: EstadoReclamacion;

  @ApiProperty({
    description: 'Observaciones para esta línea',
    required: false,
  })
  observaciones?: string;

  @ApiProperty({ description: 'ID del producto pedido', required: false })
  pedidoProductoId?: string;

  @ApiProperty({ description: 'Nombre del producto', required: false })
  nombreProducto?: string;
}
