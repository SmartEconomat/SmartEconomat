import { ApiProperty } from '@nestjs/swagger';
import {
  TipoDiferencia,
  EstadoReclamacion,
} from '../incidencia-linea.entity/incidencia-linea.entity';

export class IncidenciaLineaDto {
  @ApiProperty({ description: 'docs.ID_DE_LA_L_NEA_DE_INCIDENCIA' })
  id!: string;

  @ApiProperty({ description: 'docs.CANTIDAD_PEDIDA_ORIGINALMENTE_AL_PROVEED' })
  cantidadEsperada!: number;

  @ApiProperty({ description: 'docs.CANTIDAD_ESCANEADA_RECIBIDA_REALMENTE' })
  cantidadRecibida!: number;

  @ApiProperty({ description: 'docs.DIFERENCIA_DE_CANTIDADES' })
  diferencia!: number;

  @ApiProperty({ enum: TipoDiferencia })
  tipoDiferencia!: TipoDiferencia;

  @ApiProperty({ enum: EstadoReclamacion })
  estadoReclamacion!: EstadoReclamacion;

  @ApiProperty({
    description: 'docs.OBSERVACIONES_PARA_ESTA_L_NEA_EN_PARTICU',
    required: false,
  })
  observaciones?: string;

  @ApiProperty({ description: 'docs.ID_DEL_PRODUCTO_PEDIDO', required: false })
  pedidoProductoId?: string;

  @ApiProperty({ description: 'docs.NOMBRE_DEL_PRODUCTO', required: false })
  nombreProducto?: string;
}
