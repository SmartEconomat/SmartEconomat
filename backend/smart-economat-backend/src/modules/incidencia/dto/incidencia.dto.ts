import { ApiProperty } from '@nestjs/swagger';
import { IncidenciaLineaDto } from './incidencia-linea.dto';
import { EstadoIncidencia } from '../enums/incidencia.enums';

export class IncidenciaDto {
  @ApiProperty({ description: 'docs.ID_DE_LA_INCIDENCIA' })
  id!: string;

  @ApiProperty({ description: 'docs.ID_DE_LA_RECEPCI_N_DONDE_SE_DETECT' })
  recepcionId!: string;

  @ApiProperty({ description: 'docs.ID_DEL_PEDIDO_PROVEEDOR_AL_QUE_PERTENECE' })
  pedidoId!: string;

  @ApiProperty({
    description: 'docs.NOMBRE_O_IDENTIFICADOR_DEL_PROVEEDOR',
    required: false,
  })
  proveedorNombre?: string;

  @ApiProperty({
    description: 'docs.OBSERVACIONES_GENERALES_AL_MOMENTO_DE_LA',
    required: false,
  })
  observacionesRecepcion?: string;

  @ApiProperty({
    description: 'docs.OBSERVACIONES_A_ADIDAS_A_LA_HORA_DE_RESO',
    required: false,
  })
  observacionesResolucion?: string;

  @ApiProperty({ description: 'docs.SI_LA_INCIDENCIA_EST_RESUELTA_O_NO' })
  resuelta!: boolean;

  @ApiProperty({
    enum: EstadoIncidencia,
    description: 'Estado operativo canónico de la incidencia',
  })
  estado!: EstadoIncidencia;

  @ApiProperty({
    description: 'docs.FECHA_EN_LA_QUE_FUE_RESUELTA',
    required: false,
  })
  fechaResolucion?: Date;

  @ApiProperty({
    type: [IncidenciaLineaDto],
    description: 'docs.L_NEAS_CON_DISCREPANCIAS',
  })
  lineas!: IncidenciaLineaDto[];
}
