import { ApiProperty } from '@nestjs/swagger';

class IncidenciaGeneradaDto {
  @ApiProperty({
    description: 'UUID de la incidencia',
    example: 'uuid-incidencia',
  })
  id: string;

  @ApiProperty({
    description:
      'Estado inicial de la incidencia (siempre PENDIENTE DE RESOLUCIÓN desde el frontend_view)',
    example: 'PENDIENTE DE RESOLUCIÓN',
  })
  estado: string;

  @ApiProperty({
    description: 'Datos inmutables capturados en el momento de la recepción',
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
  @ApiProperty({ description: 'UUID del pedido', example: 'uuid-pedido' })
  id: string;

  @ApiProperty({
    description: 'Estado anterior antes de la recepción',
    example: 'en_proceso',
  })
  estadoAnterior: string;

  @ApiProperty({
    description: 'Estado resultante tras la recepción',
    example: 'recibido',
  })
  estadoNuevo: string;
}

class ProductoCreadoDto {
  @ApiProperty({
    description: 'UUID del producto creado',
    example: 'uuid-prod',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Aceite de Girasol Bio',
  })
  nombre: string;

  @ApiProperty({ description: 'Código de barras', example: '8410188009999' })
  codigoBarras: string;
}

export class RecepcionResultadoDto {
  @ApiProperty({
    description: 'UUID de la nueva recepción',
    example: 'uuid-recepcion',
  })
  id: string;

  @ApiProperty({
    description: 'Fecha de recepción',
    example: '2023-10-15T12:00:00Z',
  })
  fechaRecepcion: Date;

  @ApiProperty({
    description:
      'Incidencias generadas automáticamente por discrepancias de cantidades',
    type: [IncidenciaGeneradaDto],
  })
  incidencias: IncidenciaGeneradaDto[];

  @ApiProperty({
    description: 'Cambios de estado aplicados a los pedidos involucrados',
    type: [PedidoActualizadoDto],
  })
  pedidosActualizados: PedidoActualizadoDto[];

  @ApiProperty({
    description: 'Total de Movimientos de inventario generados (trazabilidad)',
    example: 3,
  })
  movimientosGenerados: number;

  @ApiProperty({
    description: 'Total de lotes de Inventario creados (FEFO)',
    example: 3,
  })
  inventariosCreados: number;

  @ApiProperty({
    description: 'Productos que fueron creados durante esta recepción',
    type: [ProductoCreadoDto],
  })
  productosCreados: ProductoCreadoDto[];
}
