import { ApiProperty } from '@nestjs/swagger';

class IncidenciaGeneradaDto {
  @ApiProperty({
    description: 'docs.UUID_DE_LA_INCIDENCIA',
    example: 'uuid-incidencia',
  })
  id: string;

  @ApiProperty({
    description: 'docs.ESTADO_INICIAL_DE_LA_INCIDENCIA_SIEMPRE',
    example: 'PENDIENTE DE RESOLUCIÓN',
  })
  estado: string;

  @ApiProperty({
    description: 'docs.DATOS_INMUTABLES_CAPTURADOS_EN_EL_MOMENT',
    example: {
      productos: [
        {
          idPedidoProducto: 'uuid-pp',
          nombreProducto: 'Tomate Frito',
          cantidadPedida: 20,
          cantidadRecibida: 18,
          diferencia: -2,
          tipo: 'FALTA',
        },
      ],
    },
  })
  datosOriginales: any;
}

class PedidoActualizadoDto {
  @ApiProperty({ description: 'docs.UUID_DEL_PEDIDO', example: 'uuid-pedido' })
  id: string;

  @ApiProperty({
    description: 'docs.ESTADO_ANTERIOR_ANTES_DE_LA_RECEPCI_N',
    example: 'en_proceso',
  })
  estadoAnterior: string;

  @ApiProperty({
    description: 'docs.ESTADO_RESULTANTE_TRAS_LA_RECEPCI_N',
    example: 'recibido',
  })
  estadoNuevo: string;
}

class ProductoCreadoDto {
  @ApiProperty({
    description: 'docs.UUID_DEL_PRODUCTO_CREADO',
    example: 'uuid-prod',
  })
  id: string;

  @ApiProperty({
    description: 'docs.NOMBRE_DEL_PRODUCTO',
    example: 'Aceite de Girasol Bio',
  })
  nombre: string;

  @ApiProperty({
    description: 'docs.C_DIGO_DE_BARRAS',
    example: '8410188009999',
  })
  codigoBarras: string;
}

export class RecepcionResultadoDto {
  @ApiProperty({
    description: 'docs.UUID_DE_LA_NUEVA_RECEPCI_N',
    example: 'uuid-recepcion',
  })
  id: string;

  @ApiProperty({
    description: 'docs.FECHA_DE_RECEPCI_N',
    example: '2023-10-15T12:00:00Z',
  })
  fechaRecepcion: Date;

  @ApiProperty({
    description: 'docs.INCIDENCIAS_GENERADAS_AUTOM_TICAMENTE_PO',
    type: [IncidenciaGeneradaDto],
  })
  incidencias: IncidenciaGeneradaDto[];

  @ApiProperty({
    description: 'docs.CAMBIOS_DE_ESTADO_APLICADOS_A_LOS_PEDIDO',
    type: [PedidoActualizadoDto],
  })
  pedidosActualizados: PedidoActualizadoDto[];

  @ApiProperty({
    description: 'docs.TOTAL_DE_MOVIMIENTOS_DE_INVENTARIO_GENER',
    example: 3,
  })
  movimientosGenerados: number;

  @ApiProperty({
    description: 'docs.TOTAL_DE_LOTES_DE_INVENTARIO_CREADOS_FEF',
    example: 3,
  })
  inventariosCreados: number;

  @ApiProperty({
    description: 'docs.PRODUCTOS_QUE_FUERON_CREADOS_DURANTE_EST',
    type: [ProductoCreadoDto],
  })
  productosCreados: ProductoCreadoDto[];
}
